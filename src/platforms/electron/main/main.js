let {
	app,
	BrowserWindow,
	globalShortcut,
	Menu,
	ipcMain,
} = require("electron");

let {ipcMain: ipc} = require("electron-better-ipc");
let windowStateKeeper = require("electron-window-state");
let dev = require("electron-is-dev");
let path = require("path");
let config = require("./config");
let init = require("./ipc/init");
let clipboard = require("./ipc/clipboard");
let dialog = require("./ipc/dialog");
let contextMenu = require("./ipc/contextMenu");

if (dev) {
	require("./watch");
}

app.setPath("userData", path.join(config.userDataDir, "electron"));

let asyncIpcModules = {
	dialog,
	contextMenu,
};

let syncIpcModules = {
	init,
	clipboard,
};

for (let [key, fns] of Object.entries(asyncIpcModules)) {
	for (let name in fns) {
		ipc.answerRenderer(key + "/" + name, function(args, browserWindow) {
			return fns[name](...args, browserWindow);
		});
	}
}

for (let [key, fns] of Object.entries(syncIpcModules)) {
	for (let name in fns) {
		ipcMain.addListener(key + "/" + name, async function(event, ...args) {
			event.returnValue = await fns[name](...args);
		});
	}
}

//Menu.setApplicationMenu(null);

let win;

async function createWindow() {
	let winState = windowStateKeeper();
	
	win = new BrowserWindow({
		x: winState.x,
		y: winState.y,
		width: winState.width,
		height: winState.height,
		
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		},
	});
	
	winState.manage(win);
	
	win.loadURL("file://" + path.join(__dirname, "..", "renderer", "public", "index.html"));

	let watcher;

	if (dev) {
		win.webContents.openDevTools();

		watcher = require("chokidar").watch([
			"../renderer/public",
		].map(p => path.resolve(__dirname, p)), {
			ignoreInitial: true,
		});
		
		watcher.on("change", function() {
			win.reload();
		});
	}
	
	win.on("closed", function() {
		if (watcher) {
			watcher.close();
		}

		win = null;
	});
	
	globalShortcut.register("CommandOrControl+Q", function() {
		app.quit();
	});
}

app.on("ready", function() {
	createWindow();
});

app.on("window-all-closed", function() {
	app.quit();
});
