let {ipcMain} = require("electron");
let init = require("./init");
let clipboard = require("./clipboard");
let dialog = require("./dialog");
let contextMenu = require("./contextMenu");
let openDialogWindow = require("./openDialogWindow");
let prefs = require("./prefs");
let snippets = require("./snippets");
let session = require("./session");
let devTools = require("./devTools");

let asyncModules = {
	dialog,
	contextMenu,
	openDialogWindow,
	prefs,
	snippets,
	session,
	devTools,
};

let syncModules = {
	init,
	clipboard,
};

module.exports = function(app) {
	for (let [key, module] of Object.entries(asyncModules)) {
		let fns = module(app);
		
		for (let name in fns) {
			ipcMain.handle(key + "/" + name, function(e, ...args) {
				return fns[name](e, ...args);
			});
		}
	}
	
	for (let [key, module] of Object.entries(syncModules)) {
		let fns = module(app);
		
		for (let name in fns) {
			ipcMain.on(key + "/" + name, async function(e, ...args) {
				e.returnValue = await fns[name](e, ...args);
			});
		}
	}
}
