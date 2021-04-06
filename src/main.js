let {
	app,
	BrowserWindow,
	globalShortcut,
	Menu,
	ipcMain,
} = require("electron");

let path = require("path");
let windowStateKeeper = require("electron-window-state");
let dev = require("electron-is-dev");

// HACK for https://github.com/sindresorhus/electron-better-ipc/issues/35
ipcMain.addListener("fix-event-798e09ad-0ec6-5877-a214-d552934468ff", () => {});

let win;

function createWindow() {
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
	
	win.loadURL(`file://${path.join(__dirname, "../public/index.html")}`);

	let watcher;

	if (dev) {
		win.webContents.openDevTools();

		watcher = require("chokidar").watch(path.join(__dirname, "../public/bundle.js"), {
			ignoreInitial: true,
		});
		
		watcher.on("change", () => {
			win.reload();
		});
	}
	
	win.on("closed", () => {
		if (watcher) {
			watcher.close();
		}

		win = null;
	});
	
	globalShortcut.register("CommandOrControl+Q", function() {
		app.quit();
	});
}

app.on("ready", async function() {
	createWindow();
});

app.on("window-all-closed", function() {
	app.quit();
});
