let {
	app: electronApp,
	protocol,
	BrowserWindow,
	Menu,
} = require("electron");

let windowStateKeeper = require("electron-window-state");
let path = require("path");
let yargs = require("yargs/yargs");
let {hideBin} = require("yargs/helpers");
let {removeInPlace} = require("./utils/arrayMethods");
let streamFromString = require("./utils/streamFromString");
let fs = require("./modules/fs");
let ipcMain = require("./modules/ipcMain");
let mimeTypes = require("./modules/mimeTypes");
let ipc = require("./ipc");
let config = require("./config");

class App {
	constructor() {
		this.config = config;
		
		this.appWindows = [];
		this.mainWindow = null;
		
		this.closeWithoutConfirming = new WeakSet();
		this.dialogOpeners = new WeakMap();
		this.dialogsByAppWindowAndName = new WeakMap();
		
		this.filesToOpenOnStartup = yargs(hideBin(process.argv)).argv._.map(p => path.resolve(process.cwd(), p));
		
		this.buildDir = fs(__dirname, "..", "..", "..", "..", "build", config.dev ? "electron-dev" : "electron");
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
		
		this.init();
	}
	
	init() {
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
		
		electronApp.on("ready", () => {
			protocol.registerStreamProtocol("app", async (request, callback) => {
				// tree-sitter.js requests an incorrect absolute path for some reason
				if (request.url.endsWith("tree-sitter.wasm")) {
					callback({
						mimeType: "application/wasm",
						data: this.buildDir.child("vendor", "tree-sitter", "tree-sitter.wasm").createReadStream(),
					});
					
					return;
				}
				
				let path = decodeURIComponent(new URL(request.url).pathname);
				let mimeType = mimeTypes[fs(path).type];
				
				callback({
					mimeType,
					data: this.buildDir.child(...path.substr(1).split("/")).createReadStream(),
				});
			});
			
			this.mainWindow = this.createAppWindow();
			
			electronApp.on("window-all-closed", () => {
				electronApp.quit();
			});
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
			
			if (this.mainWindow === browserWindow) {
				this.mainWindow = this.appWindows[0] || null;
			}
			
			for (let dialogWindow of this.getDialogs(browserWindow)) {
				dialogWindow.close();
			}
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
	
	openDialogWindow(name, dialogOptions, opener) {
		let browserWindow = this.dialogsByAppWindowAndName.get(opener)[name];
		
		browserWindow.setPosition(...this.calculateDialogPosition(browserWindow, opener));
		
		browserWindow.show();
		
		this.sendToRenderer(browserWindow, "dialogInit", dialogOptions);
		
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
	
	async loadJson(key, _default=null) {
		try {
			return await fs(config.userDataDir, ...key.split("/")).withExt(".json").readJson() || _default;
		} catch (e) {
			return _default;
		}
	}
	
	async saveJson(key, data) {
		let node = fs(config.userDataDir, ...key.split("/")).withExt(".json");
		
		await node.parent.mkdirp();
		await node.writeJson(data);
	}
	
	forceQuit() {
		for (let browserWindow of this.appWindows) {
			this.closeWithoutConfirming.add(browserWindow);
		}
		
		electronApp.quit();
	}
}

module.exports = App;
