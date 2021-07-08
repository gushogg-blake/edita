let {
	app,
	BrowserWindow,
	globalShortcut,
	Menu,
	ipcMain,
} = require("electron");

let http = require("http");
let express = require("express");
let getPort = require("get-port");
let nocache = require("nocache");
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
ipcMain.addListener("fix-event-798e09ad-0ec6-5877-a214-d552934468ff", () => {});

if (dev) {
	require("../watch");
}

app.setPath("userData", fs(config.userDataDir, "electron").path);

let ipcModules = {
	init,
	clipboard,
	openDialog,
};

for (let [key, fns] of Object.entries(ipcModules)) {
	for (let name in fns) {
		ipc.answerRenderer(key + "/" + name, function(args=[]) {
			return fns[name](...args);
		});
	}
}

let win;
let expressPort;
let expressApp = express();
let dir = fs(__dirname, "../public");

expressApp.set("etag", false);

expressApp.use(nocache());

expressApp.use(async function(req, res, next) {
	let {path} = req;
	
	if (path.includes("index.html")) {
		console.log("INDEX");
		res.sendFile(dir.child("index.html").path);
		console.log("INDEX");
	} else if (path.includes("bundle.js")) {
		res.sendFile(dir.child("bundle.js").path);
	} else if (path.includes("bundle.css")) {
		res.sendFile(dir.child("bundle.css").path);
	} else if (path.includes("global.css")) {
		res.sendFile(dir.child("global.css").path);
	} else if (path.includes("tree-sitter.wasm")) {
		res.sendFile(dir.child("tree-sitter.wasm").path, {
			"Content-Type": "application/wasm",
		});
	} else if (path.includes("tree-sitter.js")) {
		res.sendFile(dir.child("tree-sitter.js").path);
	} else if (path.includes("javascript.wasm")) {
		res.sendFile(dir.child("tree-sitter-javascript.wasm").path, {
		//res.sendFile(dir.child("tree-sitter-langs", "javascript.wasm").path, {
			"Content-Type": "application/wasm",
		});
	} else {
		res.status(404);
		res.send("404");
	}
});

expressApp.use(function(error, req, res, next) {
	console.error(error);
	res.status(500);
	res.send("500");
});

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
	
	console.log("LOAD" + `http://localhost:${expressPort}/index.html`);
	win.loadURL(`http://localhost:${expressPort}/index.html`);

	let watcher;

	if (dev) {
		win.webContents.openDevTools();

		watcher = require("chokidar").watch(path.join(__dirname, "../public"), {
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

app.on("ready", async function() {
	expressPort = await getPort();
	
	http.createServer(expressApp).listen(expressPort, function() {
		console.log("CERA");
		createWindow();
	});
});

app.on("window-all-closed", function() {
	app.quit();
});
