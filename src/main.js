let {
	app,
	BrowserWindow,
	globalShortcut,
	Menu,
	ipcMain,
} = require("electron");

let http = require("http");
let path = require("path");
let {ipcMain: ipc} = require("electron-better-ipc");
let windowStateKeeper = require("electron-window-state");
let dev = require("electron-is-dev");
let fs = require("flowfs");
let config = require("./config");
let expressAsyncWrap = require("./utils/express/expressAsyncWrap");
let init = require("./modules/ipc/init/main");
let clipboard = require("./modules/ipc/clipboard/main");
let openDialog = require("./modules/ipc/openDialog/main");

// HACK for https://github.com/sindresorhus/electron-better-ipc/issues/35
// TODO might not be needed anymore
ipcMain.addListener("fix-event-798e09ad-0ec6-5877-a214-d552934468ff", () => {});

if (dev) {
	require("../watch");
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
	
	win.loadURL(`file://${__dirname}/index.html`);

	let watcher;

	if (dev) {
		win.webContents.openDevTools();

		watcher = require("chokidar").watch(path.join(__dirname, "public"), {
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
