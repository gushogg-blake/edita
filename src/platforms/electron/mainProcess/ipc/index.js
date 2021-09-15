let ipcMain = require("../modules/ipcMain");
let init = require("./init");
let clipboard = require("./clipboard");
let dialog = require("./dialog");
let contextMenu = require("./contextMenu");
let openDialogWindow = require("./openDialogWindow");
let callParentWindow = require("./callParentWindow");
let jsonStore = require("./jsonStore");
let snippets = require("./snippets");
let devTools = require("./devTools");

let asyncModules = {
	dialog,
	contextMenu,
	openDialogWindow,
	callParentWindow,
	jsonStore,
	snippets,
	devTools,
};

let syncModules = {
	init,
	clipboard,
};

module.exports = function(app) {
	for (let [key, module] of Object.entries(asyncModules)) {
		let fns = module(app);
		
		ipcMain.handle(key, function(e, method, ...args) {
			return fns[method](e, ...args);
		});
	}
	
	for (let [key, module] of Object.entries(syncModules)) {
		let fns = module(app);
		
		ipcMain.on(key, async function(e, method, ...args) {
			e.returnValue = await fns[method](e, ...args);
		});
	}
}
