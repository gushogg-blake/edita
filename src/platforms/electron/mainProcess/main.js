let {
	app,
	BrowserWindow,
	globalShortcut,
	Menu,
	ipcMain,
} = require("electron");

let windowStateKeeper = require("electron-window-state");
let dev = require("electron-is-dev");
let path = require("path");
let {removeInPlace} = require("../../../utils/arrayMethods");
let config = require("./config");

require("./ipc");

if (dev) {
	require("./watch");
}

app.setPath("userData", path.join(config.userDataDir, "electron"));

Menu.setApplicationMenu(null);

let browserWindows = [];

let watcher;

if (dev) {
	watcher = require("chokidar").watch([
		"../public",
	].map(p => path.resolve(__dirname, p)), {
		ignoreInitial: true,
	});
	
	watcher.on("change", function() {
		browserWindows.forEach(win => win.reload());
	});
}

async function createWindow() {
	let winState = windowStateKeeper();
	
	browserWindow = new BrowserWindow({
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
	
	browserWindow.on("close", function(e) {
		if (!close) {
			e.preventDefault();
			
			browserWindow.webContents.send("closeWindow");
		}
	});
	
	ipcMain.on("closeWindow", function(e, browserWindow) {
		close = true;
		
		BrowserWindow.fromWebContents(e.sender).close();
	});
	
	browserWindow.on("closed", function() {
		if (watcher) {
			watcher.close();
		}
		
		removeInPlace(browserWindows, browserWindow);
	});
	
	browserWindows.push(browserWindow);
}

app.on("ready", function() {
	createWindow();
	
	globalShortcut.register("CommandOrControl+Q", function() {
		app.quit();
	});
});

app.on("window-all-closed", function() {
	app.quit();
});

app.on("before-quit", function() {
	if (watcher) {
		watcher.close();
	}
});
