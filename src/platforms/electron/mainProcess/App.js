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
let {removeInPlace} = require("../../../utils/arrayMethods");
let fs = require("./modules/fs");
let ipc = require("./ipc");
let config = require("./config");

class App {
	constructor() {
		this.config = config;
		this.browserWindows = [];
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
			
			this.createWindow();
			
			globalShortcut.register("CommandOrControl+Q", () => {
				electronApp.quit();
			});
		});
		
		electronApp.on("window-all-closed", () => {
			electronApp.quit();
		});
		
		electronApp.on("second-instance", () => {
			this.createWindow();
		});
	}
	
	createWindow() {
		let winState = windowStateKeeper();
		
		let browserWindow = new BrowserWindow({
			x: winState.x,
			y: winState.y,
			width: winState.width,
			height: winState.height,
			
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
	}
	
	browserWindowFromEvent(e) {
		return BrowserWindow.fromWebContents(e.sender);
	}
	
	callFocusedRenderer(channel, ...args) {
		let browserWindow = BrowserWindow.getFocusedWindow();
		
		if (!browserWindow) {
			return;
		}
		
		browserWindow.webContents.send(channel, ...args);
	}
	
	callRenderers(channel, ...args) {
		for (let browserWindow of this.browserWindows) {
			browserWindow.webContents.send(channel, ...args);
		}
	}
	
	loadJson(key) {
		return fs(this.config.userDataDir).child(key + ".json").readJson();
	}
	
	saveJson(key, data) {
		return fs(this.config.userDataDir).child(key + ".json").writeJson(data);
	}
}

module.exports = App;
