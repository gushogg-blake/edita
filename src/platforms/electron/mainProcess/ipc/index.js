let {ipcMain} = require("electron");
let {ipcMain: ipc} = require("electron-better-ipc");
let init = require("./init");
let clipboard = require("./clipboard");
let dialog = require("./dialog");
let contextMenu = require("./contextMenu");

let asyncModules = {
	dialog,
	contextMenu,
};

let syncModules = {
	init,
	clipboard,
};

for (let [key, fns] of Object.entries(asyncModules)) {
	for (let name in fns) {
		ipc.answerRenderer(key + "/" + name, function(args, browserWindow) {
			return fns[name](...args, browserWindow);
		});
	}
}

for (let [key, fns] of Object.entries(syncModules)) {
	for (let name in fns) {
		ipcMain.addListener(key + "/" + name, async function(event, ...args) {
			event.returnValue = await fns[name](...args);
		});
	}
}
