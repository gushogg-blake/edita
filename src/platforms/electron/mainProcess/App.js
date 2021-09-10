let {
	app: electronApp,
	protocol,
	BrowserWindow,
	globalShortcut,
	Menu,
	ipcMain,
} = require("electron");

let windowStateKeeper = require("electron-window-state");
let path = require("path");
let yargs = require("yargs/yargs");
let {hideBin} = require("yargs/helpers");
let {removeInPlace} = require("../../../utils/arrayMethods");
let Evented = require("../../../utils/Evented");
let fs = require("./modules/fs");
let ipc = require("./ipc");
let config = require("./config");

class App extends Evented {
	constructor() {
		super();
		
		this.config = config;
		this.appWindows = [];
		this.dialogWindows = [];
		this.closeWithoutConfirming = new WeakMap();
		this.mainWindow = null;
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
				this.mainWindow.webContents.send("open", files);
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
				
				browserWindow.webContents.send("closeWindow");
			}
		});
		
		browserWindow.on("closed", () => {
			removeInPlace(this.appWindows, browserWindow);
		});
		
		this.appWindows.push(browserWindow);
		
		return browserWindow;
	}
	
	createDialogWindow(url, options) {
		let browserWindow = new BrowserWindow({
			...options,
			
			webPreferences: {
				nodeIntegration: true,
				contextIsolation: false,
			},
			
			backgroundColor: "#edecea",
		});
		
		browserWindow.loadURL("app://-" + url);
		
		if (config.dev) {
			browserWindow.webContents.openDevTools();
		}
		
		browserWindow.on("closed", () => {
			removeInPlace(this.dialogWindows, browserWindow);
			
			this.fire("dialogWindowClosed", {
				browserWindow,
			});
		});
		
		this.dialogWindows.push(browserWindow);
		
		return browserWindow;
	}
	
	openDialogWindow(url, options, opener) {
		options = {
			width: 800,
			height: 600,
			...options,
		};
		
		let openerBounds = opener.getBounds();
		
		let x = Math.round(openerBounds.x + (openerBounds.width - options.width) / 2);
		let y = Math.round(openerBounds.y + (openerBounds.height - options.height) / 2);
		
		let browserWindow = this.createDialogWindow(url, {
			x,
			y,
			...options,
		});
		
		this.fire("dialogWindowOpened", {
			browserWindow,
			url,
			options,
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
		this.getFocusedBrowserWindow()?.webContents.send(channel, ...args);
	}
	
	callRenderers(channel, ...args) {
		for (let browserWindow of [...this.appWindows, ...this.dialogWindows]) {
			browserWindow.webContents.send(channel, ...args);
		}
	}
	
	async loadJson(key) {
		try {
			return await fs(this.config.userDataDir, ...key.split("/")).withExt(".json").readJson();
		} catch (e) {
			return null;
		}
	}
	
	saveJson(key, data) {
		return fs(this.config.userDataDir, ...key.split("/")).withExt(".json").writeJson(data);
	}
}

module.exports = App;
