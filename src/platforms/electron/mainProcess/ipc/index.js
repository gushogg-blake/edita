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

module.exports = function(app) {
	for (let [key, module] of Object.entries(asyncModules)) {
		let fns = module(app);
		
		for (let name in fns) {
			ipc.answerRenderer(key + "/" + name, function(args, browserWindow) {
				return fns[name](...args, browserWindow);
			});
		}
	}
	
	for (let [key, module] of Object.entries(syncModules)) {
		let fns = module(app);
		
		for (let name in fns) {
			ipcMain.addListener(key + "/" + name, async function(event, ...args) {
				event.returnValue = await fns[name](event, ...args);
			});
		}
	}
}
