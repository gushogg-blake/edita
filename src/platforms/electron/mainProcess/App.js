let {
	app: electronApp,
	protocol,
	BrowserWindow,
	globalShortcut,
	Menu,
} = require("electron");

let windowStateKeeper = require("electron-window-state");
let path = require("path");
let yargs = require("yargs/yargs");
let {hideBin} = require("yargs/helpers");
let {removeInPlace} = require("./utils/arrayMethods");
let Evented = require("./utils/Evented");
let fs = require("./modules/fs");
let ipcMain = require("./modules/ipcMain");
let ipc = require("./ipc");
let config = require("./config");

class App extends Evented {
	constructor() {
		super();
		
		this.config = config;
		
		this.appWindows = [];
		this.dialogWindows = [];
		this.mainWindow = null;
		
		this.closeWithoutConfirming = new WeakMap();
		this.dialogOpeners = new WeakMap();
		this.dialogWindowsByName = {};
		
		this.filesToOpenOnStartup = yargs(hideBin(process.argv)).argv._.map(p => path.resolve(process.cwd(), p));
	}
	
	async launch() {
		if (!config.forceNewInstance && !electronApp.requestSingleInstanceLock()) {
			electronApp.quit();
			
			return;
		}
		
		this.init();
	}
	
	init() {
		ipc(this);
		
		ipcMain.on("closeWindow", (e) => {
			let browserWindow = this.browserWindowFromEvent(e);
			
			this.closeWithoutConfirming.set(browserWindow);
			
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
		
		electronApp.on("ready", () => {
			protocol.registerFileProtocol("app", (request, callback) => {
				let path = decodeURIComponent(new URL(request.url).pathname);
				
				// tree-sitter.js requests an incorrect absolute path for some reason
				if (path.endsWith("tree-sitter.wasm")) {
					callback({
						path: fs(__dirname, "..", "public", "vendor", "tree-sitter", "tree-sitter.wasm").path,
					});
					
					return;
				}
				
				callback({
					path: fs(__dirname, "..", "public", ...path.split("/").filter(Boolean)).path,
				});
			});
			
			this.mainWindow = this.createAppWindow();
			
			globalShortcut.register("CommandOrControl+Q", () => {
				electronApp.quit();
			});
		});
		
		electronApp.on("window-all-closed", () => {
			electronApp.quit();
		});
		
		electronApp.on("second-instance", (e, argv, dir) => {
			let files = yargs(hideBin(argv)).argv._.map(p => path.resolve(dir, p));
			
			if (files.length > 0) {
				ipcMain.sendToRenderer(this.mainWindow, "open", files);
			} else {
				this.createAppWindow();
			}
		});
	}
	
	createAppWindow() {
		let winState = windowStateKeeper();
		
		let browserWindow = new BrowserWindow({
			x: winState.x - 3, // DEV
			y: winState.y,
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
			
			for (let dialogWindow of this.dialogWindows) {
				if (this.dialogOpeners.get(dialogWindow) === browserWindow) {
					dialogWindow.close();
				}
			}
		});
		
		this.appWindows.push(browserWindow);
		
		return browserWindow;
	}
	
	createDialogWindow(name, url, options, opener) {
		let browserWindow = new BrowserWindow({
			...options,
			
			webPreferences: {
				nodeIntegration: true,
				contextIsolation: false,
			},
			
			backgroundColor: "#edecea",
		});
		
		browserWindow.loadURL(url);
		
		browserWindow.on("closed", () => {
			removeInPlace(this.dialogWindows, browserWindow);
			
			delete this.dialogWindowsByName[name];
						
			this.fire("dialogWindowClosed", {
				browserWindow,
			});
		});
		
		this.dialogWindows.push(browserWindow);
		this.dialogWindowsByName[name] = browserWindow;
		this.dialogOpeners.set(browserWindow, opener);
		
		return browserWindow;
	}
	
	openDialogWindow(name, dialogOptions, windowOptions, opener) {
		let url = "app://-/dialogs/" + name + ".html?options=" + encodeURIComponent(JSON.stringify(dialogOptions));
		let existingWindow = this.dialogWindowsByName[name];
		
		if (existingWindow) {
			existingWindow.loadURL(url);
			existingWindow.show();
			
			return;
		}
		
		windowOptions = {
			width: 800,
			height: 600,
			useOpenerAsParent: false,
			...windowOptions,
		};
		
		let openerBounds = opener.getBounds();
		
		let x = Math.round(openerBounds.x + (openerBounds.width - windowOptions.width) / 2);
		let y = Math.round(openerBounds.y + (openerBounds.height - windowOptions.height) / 2);
		
		let browserWindow = this.createDialogWindow(name, url, {
			x,
			y,
			parent: windowOptions.useOpenerAsParent ? opener : undefined,
			...windowOptions,
		}, opener);
		
		if (config.dev) {
			//browserWindow.webContents.openDevTools();
		}
		
		this.fire("dialogWindowOpened", {
			browserWindow,
			url,
			windowOptions,
			opener,
		});
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
	
	sendToRenderers(channel, ...args) {
		for (let browserWindow of [...this.appWindows, ...this.dialogWindows]) {
			ipcMain.sendToRenderer(browserWindow, channel, ...args);
		}
	}
	
	async loadJson(key, _default=null) {
		try {
			return await fs(this.config.userDataDir, ...key.split("/")).withExt(".json").readJson() || _default;
		} catch (e) {
			return _default;
		}
	}
	
	async saveJson(key, data) {
		let node = fs(this.config.userDataDir, ...key.split("/")).withExt(".json");
		
		await node.parent.mkdirp();
		await node.writeJson(data);
	}
	
	forceQuit() {
		for (let browserWindow of this.appWindows) {
			this.closeWithoutConfirming.set(browserWindow);
		}
		
		electronApp.quit();
	}
}

module.exports = App;
