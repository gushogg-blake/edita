let {
	app: electronApp,
	protocol,
	BrowserWindow,
	globalShortcut,
	Menu,
	ipcMain,
} = require("electron");

let windowStateKeeper = require("electron-window-state");
let dev = require("electron-is-dev");
let path = require("path");
let yargs = require("yargs/yargs");
let {hideBin} = require("yargs/helpers");
let {removeInPlace} = require("../../../utils/arrayMethods");
let fs = require("./modules/fs");
let ipc = require("./ipc");
let config = require("./config");

class App {
	constructor() {
		this.config = config;
		this.browserWindows = [];
		this.mainWindow = null;
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
			
			this.mainWindow = this.createWindow();
			
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
				this.createWindow();
			}
		});
	}
	
	createWindow() {
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
				nativeWindowOpen: true,
			},
			
			backgroundColor: "#edecea",
		});
		
		winState.manage(browserWindow);
		
		browserWindow.loadURL("app://-/main.html");
		
		if (dev) {
			browserWindow.webContents.openDevTools();
		}
		
		let close = false;
		
		browserWindow.on("close", (e) => {
			if (!close) {
				e.preventDefault();
				
				browserWindow.webContents.send("closeWindow");
			}
		});
		
		ipcMain.on("closeWindow", (e) => {
			if (this.browserWindowFromEvent(e) !== browserWindow) {
				return;
			}
			
			close = true;
			
			browserWindow.close();
		});
		
		browserWindow.on("closed", () => {
			removeInPlace(this.browserWindows, browserWindow);
		});
		
		this.browserWindows.push(browserWindow);
		
		return browserWindow;
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
		for (let browserWindow of this.browserWindows) {
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
