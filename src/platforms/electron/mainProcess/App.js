let {
	app: electronApp,
	protocol,
	BrowserWindow,
	Menu,
} = require("electron");

let {Readable} = require("stream");
let path = require("path");
let windowStateKeeper = require("electron-window-state");
let {removeInPlace} = require("./utils/arrayMethods");
let getConfig = require("./utils/getConfig");
let fs = require("./modules/fs");
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
	
	async init() {
		ipc(this);
		
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
			
			this.mainWindow = this.createAppWindow();
			this.lastFocusedWindow = this.mainWindow;
			
			electronApp.on("window-all-closed", () => {
				electronApp.quit();
			});
		});
		
		electronApp.on("second-instance", (e, argv) => {
			let config = getConfig(argv);
			let files = config.files.map(p => path.resolve(config.cwd, p));
			
			if (files.length > 0) {
				ipcMain.sendToRenderer(this.lastFocusedWindow, "open", files);
			} else {
				this.createAppWindow();
			}
		});
		
		await this.mkdirs();
	}
	
	createAppWindow() {
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
	
	calculateDialogPosition(dialogWindow, opener) {
		let openerBounds = opener.getBounds();
		let dialogBounds = dialogWindow.getBounds();
		let x = Math.round(openerBounds.x + (openerBounds.width - dialogBounds.width) / 2);
		let y = Math.round(openerBounds.y + (openerBounds.height - dialogBounds.height) / 2);
		
		return [x, y];
	}
	
	async openDialogWindow(name, dialogOptions, opener) {
		let browserWindow = this.dialogsByAppWindowAndName.get(opener)[name];
		
		browserWindow.setPosition(...this.calculateDialogPosition(browserWindow, opener));
		
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
