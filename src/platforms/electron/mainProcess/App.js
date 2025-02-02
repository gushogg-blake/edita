let {
	app: electronApp,
	protocol,
	BrowserWindow,
	Menu,
} = require("electron");

let {Readable} = require("stream");
let path = require("path");
let windowStateKeeper = require("electron-window-state");
let {fs, cmdSync} = require("utils/node/index");
let {removeInPlace} = require("utils/arrayMethods");
let getConfig = require("./utils/getConfig");
let ipcMain = require("./modules/ipcMain");
let mimeTypes = require("./modules/mimeTypes");
let jsonStore = require("./modules/jsonStore");
let ipc = require("./ipc");
let config = require("./config");

class App {
	constructor() {
		this.config = config;
		
		this.appWindows = [];
		this.mainWindow = null;
		this.lastFocusedWindow = null;
		
		this.closeWithoutConfirming = new WeakSet();
		this.dialogOpeners = new WeakMap();
		this.dialogsByAppWindowAndName = new WeakMap();
		this.perWindowConfig = new WeakMap();
		
		this.dialogPositions = {
			fileChooser: "centerOfScreen",
		};
		
		this.dataDir = fs(this.config.userDataDir);
		this.buildDir = fs(__dirname, "..", "..", config.dev ? "electron-dev" : "electron");
		this.rootDir = this.buildDir.rel("..", "..");
		
		this.jsonStore = jsonStore(this);
	}
	
	get dialogWindows() {
		return this.appWindows.map(w => this.getDialogs(w)).flat();
	}
	
	getDialogs(appWindow) {
		return Object.values(this.dialogsByAppWindowAndName.get(appWindow));
	}
	
	async launch() {
		if (!config.forceNewInstance && !electronApp.requestSingleInstanceLock()) {
			electronApp.quit();
			
			return;
		}
		
		await this.init();
	}
	
	getPerWindowConfig(window) {
		return {
			...this.config,
			...this.perWindowConfig.get(window),
		};
	}
	
	async init() {
		ipc(this);
		
		ipcMain.on("showWindow", (e) => {
			let browserWindow = this.browserWindowFromEvent(e);
			
			browserWindow.show();
		});
		
		ipcMain.on("closeWindow", (e) => {
			let browserWindow = this.browserWindowFromEvent(e);
			
			this.closeWithoutConfirming.add(browserWindow);
			
			browserWindow.close();
		});
		
		Menu.setApplicationMenu(null);
		
		protocol.registerSchemesAsPrivileged([
			{
				scheme: "app",
				
				privileges: {
					standard: true,
					secure: true,
					supportFetchAPI: true,
				},
			},
		]);
		
		electronApp.on("ready", async () => {
			try {
				this.windowPositionAdjustment = (await this.jsonStore.load("prefs"))?.value.windowPositionAdjustment; // https://github.com/electron/electron/issues/10388
			} catch (e) {
				console.error(e);
			}
			
			protocol.registerStreamProtocol("app", async (request, callback) => {
				let requestPath = decodeURIComponent(new URL(request.url).pathname);
				let {name, type} = fs(requestPath);
				let mimeType = mimeTypes[type];
				let path;
				
				function emptyStream() {
					let stream = new Readable();
					
					stream.push(null);
					
					return stream;
				}
				
				if (name === "tree-sitter.wasm") {
					// tree-sitter.js requests an incorrect absolute path for some reason
					
					path = "vendor/tree-sitter/tree-sitter.wasm";
				} else if (name.match(/^tree-sitter-.+\.wasm$/)) {
					/*
					parsers that are linked into the tree-sitter wasm at compile time
					(to solve system library linking issues) are requested as just
					"tree-sitter-*.wasm"
					
					See:
					
					- https://github.com/emscripten-core/emscripten/issues/8308
					- https://emscripten.org/docs/compiling/Dynamic-Linking.html (System Libraries section)
					- https://github.com/tree-sitter/tree-sitter/issues/949
					- howto/tree-sitter.md
					
					for more on why some parsers are linked in like this.
					*/
					
					path = "vendor/tree-sitter/langs/" + name;
				} else {
					path = requestPath.substr(1);
				}
				
				let node = this.buildDir.child(...path.split("/"));
				
				if (await node.exists()) {
					callback({
						mimeType,
						data: request.method === "HEAD" ? emptyStream() : node.createReadStream(),
					});
				} else {
					callback({
						statusCode: request.method === "HEAD" ? 204 : 404,
						data: emptyStream(),
					});
				}
			});
			
			if (!config.nodeOnly) {
				this.mainWindow = this.createAppWindow();
				this.lastFocusedWindow = this.mainWindow;
			}
			
			electronApp.on("window-all-closed", () => {
				electronApp.quit();
			});
		});
		
		electronApp.on("second-instance", (e, argv) => {
			let config = getConfig(argv);
			let files = config.files.map(p => path.resolve(config.cwd, p));
			
			if (files.length > 0) {
				// if there's a window on the current workspace, open the
				// file in it - otherwise create a new window
				
				let currentWorkspace = this.getCurrentWorkspace();
				let windowsToWorkspaces = this.mapWindowsToWorkspaces();
				let openInExistingWindow = null;
				
				if (windowsToWorkspaces.get(this.lastFocusedWindow) === currentWorkspace) {
					openInExistingWindow = this.lastFocusedWindow;
				} else {
					openInExistingWindow = this.appWindows.find(w => windowsToWorkspaces.get(w) === currentWorkspace);
				}
				
				if (openInExistingWindow) {
					ipcMain.sendToRenderer(openInExistingWindow, "open", files);
					
					openInExistingWindow.show();
				} else {
					this.createAppWindow(files);
				}
			} else {
				this.createAppWindow();
			}
		});
		
		await this.mkdirs();
	}
	
	getCurrentWorkspace() {
		let currentWorkspaceRaw = cmdSync(`xprop -root _NET_CURRENT_DESKTOP`);
		
		/*
		e.g.
		
		_NET_CURRENT_DESKTOP(CARDINAL) = 0
		*/
		
		return currentWorkspaceRaw.replace("_NET_CURRENT_DESKTOP(CARDINAL) = ", "").trim();
	}
	
	getWindowId(window) {
		/*
		getNativeWindowHandle returns a Buffer containing window ID as an
		unsigned long
		
		window IDs from wmctrl are in hex. we can convert the buffer to a
		hex string with toString.
		
		trying this, it seems that the hex bytes are reversed so e.g.
		0x05a00003 (actual ID) becomes 0300a005
		
		so we reverse them and add 0x to get our X window ID.
		*/
		
		let handle = window.getNativeWindowHandle();
		let str = handle.toString("hex");
		let parts = str.match(/\w{2}/g);
		
		parts.reverse();
		
		let id = "0x" + parts.join("");
		
		return id;
	}
	
	mapWindowsToWorkspaces() {
		/*
		list all X windows and the workspace they're on (second field below)
		and match them to our windows using the id (first field)
		*/
		
		let openWindowsRaw = cmdSync(`wmctrl -lp`);
		
		/*
		e.g.
		
		0x00c00003 -1 1689   mint Bottom Panel
		0x00e00006 -1 1716   mint Desktop
		0x03400004  0 2304   mint Execute and get the output of a shell command in node.js - Stack Overflow - Brave
		0x00e00430  0 1716   mint hogg-blake software ltd
		0x03c00006  0 3255   mint gus@mint ~/Pictures/teeth/resize75
		0x04400003  0 5414   mint currentWorkspaceHasWindow.js (~/projects/edita/src/platforms/electron/mainProcess/utils) - Edita
		0x05200006  0 5658   mint gus@mint ~
		0x05200192  0 5658   mint gus@mint ~/projects/edita
		*/
		
		let windows = openWindowsRaw.trim().split("\n").map((line) => {
			let [id, workspace] = line.split(/\s+/);
			
			let window = this.appWindows.find(w => this.getWindowId(w) === id);
			
			return {window, workspace};
		}).filter(r => r.window);
		
		let map = new Map();
		
		for (let {window, workspace} of windows) {
			map.set(window, workspace);
		}
		
		return map;
	}
	
	createAppWindow(openFiles=null) {
		let {
			x = 0,
			y = 0,
		} = this.windowPositionAdjustment || {};
		
		let winState = windowStateKeeper();
		
		let browserWindow = new BrowserWindow({
			x: winState.x + x,
			y: winState.y + y,
			width: winState.width,
			height: winState.height,
			useContentSize: true,
			
			webPreferences: {
				nodeIntegration: true,
				contextIsolation: false,
			},
			
			backgroundColor: "#edecea",
		});
		
		if (openFiles) {
			this.perWindowConfig.set(browserWindow, {
				files: openFiles,
			});
		}
		
		winState.manage(browserWindow);
		
		browserWindow.loadURL("app://-/main.html");
		
		if (config.dev) {
			browserWindow.webContents.openDevTools();
		}
		
		let close = false;
		
		browserWindow.on("close", (e) => {
			if (!this.closeWithoutConfirming.has(browserWindow)) {
				e.preventDefault();
				
				ipcMain.sendToRenderer(browserWindow, "closeWindow");
			}
		});
		
		browserWindow.on("closed", () => {
			removeInPlace(this.appWindows, browserWindow);
			
			if (this.mainWindow === browserWindow) {
				this.mainWindow = this.appWindows[0] || null;
			}
			
			if (this.lastFocusedWindow === browserWindow) {
				this.lastFocusedWindow = this.mainWindow;
			}
			
			for (let dialogWindow of this.getDialogs(browserWindow)) {
				dialogWindow.close();
			}
		});
		
		browserWindow.on("focus", () => {
			this.lastFocusedWindow = browserWindow;
		});
		
		this.dialogsByAppWindowAndName.set(browserWindow, {
			fileChooser: this.createDialogWindow("fileChooser", {
				width: 900,
				height: 670,
			}, browserWindow),
			
			findAndReplace: this.createDialogWindow("findAndReplace", {
				width: 640,
				height: 300,
			}, browserWindow),
			
			snippetEditor: this.createDialogWindow("snippetEditor", {
				width: 680,
				height: 480,
			}, browserWindow),
			
			messageBox: this.createDialogWindow("messageBox", {
				width: 500,
				height: 75,
			}, browserWindow),
		});
		
		this.appWindows.push(browserWindow);
		
		return browserWindow;
	}
	
	createDialogWindow(name, windowOptions, opener) {
		let url = "app://-/dialogs/" + name + ".html";
		
		let browserWindow = new BrowserWindow({
			show: false,
			useContentSize: true,
			
			webPreferences: {
				nodeIntegration: true,
				contextIsolation: false,
			},
			
			backgroundColor: "#edecea",
			...windowOptions,
		});
		
		browserWindow.on("close", (e) => {
			if (this.appWindows.includes(this.dialogOpeners.get(browserWindow))) {
				e.preventDefault();
				
				browserWindow.hide();
				
				this.sendToRenderer(browserWindow, "dialogClosed");
			}
		});
		
		browserWindow.loadURL(url);
		
		this.dialogOpeners.set(browserWindow, opener);
		
		return browserWindow;
	}
	
	setDialogPosition(name, dialogWindow, opener) {
		let mode = this.dialogPositions[name] || "centerOfOpener";
		
		if (mode === "centerOfOpener") {
			let openerBounds = opener.getBounds();
			let dialogBounds = dialogWindow.getBounds();
			let x = Math.round(openerBounds.x + (openerBounds.width - dialogBounds.width) / 2);
			let y = Math.round(openerBounds.y + (openerBounds.height - dialogBounds.height) / 2);
			
			dialogWindow.setPosition(x, y);
		} else if (mode === "centerOfScreen") {
			dialogWindow.center();
		}
	}
	
	async openDialogWindow(name, dialogOptions, opener) {
		let browserWindow = this.dialogsByAppWindowAndName.get(opener)[name];
		
		this.setDialogPosition(name, browserWindow, opener);
		
		let showOnTimeout = setTimeout(function() {
			browserWindow.show();
		}, 1000);
		
		try {
			await this.callRenderer(browserWindow, "dialogInit", dialogOptions);
		} catch (e) {
			throw e;
		} finally {
			clearTimeout(showOnTimeout);
			
			browserWindow.show();
		}
		
		if (config.dev) {
			//browserWindow.webContents.openDevTools();
		}
	}
	
	browserWindowFromEvent(e) {
		return BrowserWindow.fromWebContents(e.sender);
	}
	
	getFocusedBrowserWindow() {
		return BrowserWindow.getFocusedWindow();
	}
	
	callFocusedRenderer(channel, ...args) {
		return ipcMain.callRenderer(this.getFocusedBrowserWindow(), channel, ...args);
	}
	
	callRenderer(browserWindow, channel, ...args) {
		return ipcMain.callRenderer(browserWindow, channel, ...args);
	}
	
	sendToRenderer(browserWindow, channel, ...args) {
		ipcMain.sendToRenderer(browserWindow, channel, ...args);
	}
	
	sendToRenderers(channel, ...args) {
		for (let browserWindow of [...this.appWindows, ...this.dialogWindows]) {
			ipcMain.sendToRenderer(browserWindow, channel, ...args);
		}
	}
	
	mkdirs() {
		return Promise.all([
			"snippets",
		].map(dir => this.dataDir.child(dir).mkdirp()));
	}
	
	forceQuit() {
		for (let browserWindow of this.appWindows) {
			this.closeWithoutConfirming.add(browserWindow);
		}
		
		electronApp.quit();
	}
}

module.exports = App;
