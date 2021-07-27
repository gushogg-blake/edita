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
let fs = require("flowfs");
let config = require("./config");
let init = require("./ipc/init");
let clipboard = require("./ipc/clipboard");
let openDialog = require("./ipc/openDialog");

if (dev) {
	require("./watch");
}

app.setPath("userData", fs(config.userDataDir, "electron").path);

let asyncIpcModules = {
	openDialog,
};

let syncIpcModules = {
	init,
	clipboard,
};

for (let [key, fns] of Object.entries(asyncIpcModules)) {
	for (let name in fns) {
		ipc.answerRenderer(key + "/" + name, function(args=[]) {
			return fns[name](...args);
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
	
	win.loadURL("file://" + fs(__dirname).sibling("renderer", "public", "index.html").path);

	let watcher;

	if (dev) {
		win.webContents.openDevTools();

		watcher = require("chokidar").watch([
			"../../../../build/electron",
			"../renderer/public",
			"../../../../vendor",
		].map(path => fs(__dirname).rel(path).path), {
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
