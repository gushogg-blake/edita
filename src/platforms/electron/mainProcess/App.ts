import {
	app as electronApp,
	protocol,
	BrowserWindow,
	Menu,
} from "electron";

import {Readable} from "node:stream";
import path from "node:path";
import windowStateKeeper from "electron-window-state";
import {fs, cmdSync} from "utils/node";
import {removeInPlace} from "utils/array";
import getConfig from "./utils/getConfig";
import ipcMain from "./modules/ipcMain";
import mimeTypes from "./modules/mimeTypes";
import jsonStore from "./modules/jsonStore";
import ipc from "./ipc";
import config from "./config";

type DialogPosition = "centerOfScreen" | "centerOfOpener";

export default class App {
	config: any;
	appWindows: BrowserWindow[] = [];
	mainWindow: BrowserWindow | null;
	lastFocusedWindow: BrowserWindow | null;
	
	dataDir: any; // TYPE fs Node
	buildDir: any; // TYPE fs Node
	rootDir: any; // TYPE fs Node
	
	jsonStore: any; // TYPE ./modules/jsonStore
	
	private closeWithoutConfirming = new WeakSet<BrowserWindow>();
	private dialogOpeners = new WeakMap<BrowserWindow, BrowserWindow>();
	private dialogsByAppWindowAndName = new WeakMap<BrowserWindow, Record<string, BrowserWindow>>();
	private perWindowConfig = new WeakMap<BrowserWindow, any>();
	private dialogPositions: Record<string, DialogPosition>;
	
	// https://github.com/electron/electron/issues/10388
	private windowPositionAdjustment: {x: number; y: number} | null = null;
	
	constructor() {
		this.config = config;
		
		this.dialogPositions = {
			fileChooser: "centerOfScreen",
		};
		
		let {userDataDir, buildDir, rootDir} = this.config;
		
		this.dataDir = fs(userDataDir);
		this.buildDir = fs(buildDir);
		this.rootDir = fs(rootDir);
		
		this.jsonStore = jsonStore(this);
	}
	
	get windows(): BrowserWindow[] {
		return [...this.appWindows, ...this.dialogWindows];
	}
	
	get dialogWindows(): BrowserWindow[] {
		return this.appWindows.map(w => this.getDialogs(w)).flat();
	}
	
	getDialogs(appWindow): BrowserWindow[] {
		return Object.values(this.dialogsByAppWindowAndName.get(appWindow));
	}
	
	async launch(): Promise<void> {
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
	
	async init(): Promise<void> {
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
				this.windowPositionAdjustment = (await this.jsonStore.load("prefs"))?.value.windowPositionAdjustment;
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
				
				path = requestPath.substr(1);
				
				// all actual code and wasm files are in the build dir...
				let built = this.buildDir.child(...path.split("/"));
				// ...ts files (from src) are needed for source mapping
				let src = this.rootDir.child(...path.split("/"));
				let node = await built.exists() ? built : await src.exists() ? src : null;
				
				if (node) {
					callback({
						mimeType,
						data: node.createReadStream(),
					});
				} else {
					callback({
						statusCode: 404,
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
	
	// PLATFORM
	getCurrentWorkspace(): string {
		let currentWorkspaceRaw = cmdSync(`xprop -root _NET_CURRENT_DESKTOP`);
		
		/*
		e.g.
		
		_NET_CURRENT_DESKTOP(CARDINAL) = 0
		*/
		
		return currentWorkspaceRaw.replace("_NET_CURRENT_DESKTOP(CARDINAL) = ", "").trim();
	}
	
	// PLATFORM
	getWindowId(window: BrowserWindow): string {
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
	
	// PLATFORM
	mapWindowsToWorkspaces(): Map<BrowserWindow, string> {
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
	
	createAppWindow(openFiles: string[] | null = null): BrowserWindow {
		let {
			x = 0,
			y = 0,
		} = this.windowPositionAdjustment || {};
		
		let winState = windowStateKeeper({});
		
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
		
		browserWindow.loadURL("app://-/index.html");
		
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
	
	createDialogWindow(name: string, windowOptions, opener: BrowserWindow): BrowserWindow {
		let url = "app://-/index.html?dialog=" + name;
		
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
	
	setDialogPosition(name: string, dialogWindow: BrowserWindow, opener: BrowserWindow) {
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
	
	async openDialogWindow(name: string, dialogOptions, opener: BrowserWindow) {
		let browserWindow = this.dialogsByAppWindowAndName.get(opener)[name];
		
		this.setDialogPosition(name, browserWindow, opener);
		
		let showOnTimeout = setTimeout(function() {
			browserWindow.show();
			browserWindow.webContents.openDevTools();
		}, 1000);
		
		try {
			await this.callRenderer(browserWindow, "dialogInit", dialogOptions);
		} catch (e) {
			throw e;
		} finally {
			clearTimeout(showOnTimeout);
			
			browserWindow.show();
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
		
	}
	
	forceQuit(): void {
		for (let browserWindow of this.appWindows) {
			this.closeWithoutConfirming.add(browserWindow);
		}
		
		electronApp.quit();
	}
}
