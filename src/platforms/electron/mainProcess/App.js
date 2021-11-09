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
let Evented = require("./utils/Evented");
let streamFromString = require("./utils/streamFromString");
let fs = require("./modules/fs");
let ipcMain = require("./modules/ipcMain");
let mimeTypes = require("./modules/mimeTypes");
let ipc = require("./ipc");
let config = require("./config");

class App extends Evented {
	constructor() {
		super();
		
		this.config = config;
		
		this.appWindows = [];
		this.mainWindow = null;
		
		this.closeWithoutConfirming = new WeakSet();
		this.dialogOpeners = new WeakMap();
		this.dialogsByAppWindowAndName = new WeakMap();
		
		this.filesToOpenOnStartup = yargs(hideBin(process.argv)).argv._.map(p => path.resolve(process.cwd(), p));
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
				let publicDir = fs(__dirname, "..", "public");
				
				// tree-sitter.js requests an incorrect absolute path for some reason
				if (request.url.endsWith("tree-sitter.wasm")) {
					callback({
						mimeType: "application/wasm",
						data: publicDir.child("vendor", "tree-sitter", "tree-sitter.wasm").createReadStream(),
					});
					
					return;
				}
				
				if (request.url === "app://-/main.html") {
					let code = await publicDir.child("main.html").read();
					
					let replacements = {
						js: this.config.dev ? "main.dev" : "main",
					};
					
					code = code.replace(/\$\{(\w+)\}/g, (_, k) => replacements[k]);
					
					callback({
						mimeType: "text/html",
						data: streamFromString(code),
					});
					
					return;
				}
				
				let path = decodeURIComponent(new URL(request.url).pathname);
				let mimeType = mimeTypes[fs(path).type];
				
				callback({
					mimeType,
					data: publicDir.child(...path.substr(1).split("/")).createReadStream(),
				});
			});
			
			this.mainWindow = this.createAppWindow();
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
		
		console.log("??");
		
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
				console.log(dialogWindow.getBounds());
				dialogWindow.close();
			}
		});
		
		setTimeout(() => {
		this.dialogsByAppWindowAndName.set(browserWindow, {
			findAndReplace: this.createDialogWindow("findAndReplace", {}, browserWindow),
			
			snippetEditor: this.createDialogWindow("snippetEditor", {
				width: 680,
				height: 480,
			}, browserWindow),
			
			messageBox: this.createDialogWindow("messageBox", {
				width: 500,
				height: 75,
			}, browserWindow),
		});
		}, 1000);
		
		this.appWindows.push(browserWindow);
		
		return browserWindow;
	}
	
	createDialogWindow(name, windowOptions, opener) {
		let url = "app://-/dialogs/" + name + ".html";
		
		let browserWindow = new BrowserWindow({
			//show: false,
			
			webPreferences: {
				nodeIntegration: true,
				contextIsolation: false,
			},
			
			backgroundColor: "#edecea",
			...windowOptions,
		});
		
		//browserWindow.on("close", (e) => {
		//	e.preventDefault();
		//	
		//	browserWindow.hide();
		//});
		
		console.log("????");
		
		browserWindow.loadURL(url);
		
		this.dialogOpeners.set(browserWindow, opener);
		
		return browserWindow;
	}
	
	openDialogWindow(name, dialogOptions, opener) {
		let browserWindow = this.dialogsByAppWindowAndName.get(opener)[name];
		let openerBounds = opener.getBounds();
		let dialogBounds = browserWindow.getBounds();
		
		let x = Math.round(openerBounds.x + (openerBounds.width - dialogBounds.width) / 2);
		let y = Math.round(openerBounds.y + (openerBounds.height - dialogBounds.height) / 2);
		
		this.callRenderer(browserWindow, "dialogInit", dialogOptions);
		
		browserWindow.setPosition(x, y);
		browserWindow.show();
		
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
			this.closeWithoutConfirming.add(browserWindow);
		}
		
		electronApp.quit();
	}
}

module.exports = App;
