let {
	app: electronApp,
	BrowserWindow,
	globalShortcut,
	Menu,
	ipcMain,
} = require("electron");

let windowStateKeeper = require("electron-window-state");
let dev = require("electron-is-dev");
let fs = require("fs-extra");
let path = require("path");
let {removeInPlace} = require("../../../utils/arrayMethods");
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
		
		electronApp.on("ready", () => {
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
			},
			
			backgroundColor: "#edecea",
		});
		
		winState.manage(browserWindow);
		
		browserWindow.loadURL("file://" + path.join(__dirname, "..", "public", "index.html"));
		
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
}

module.exports = App;
