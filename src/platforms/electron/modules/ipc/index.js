let ipcRenderer = require("platform/modules/ipcRenderer");
let dialog = require("./dialog");
let clipboard = require("./clipboard");
let contextMenu = require("./contextMenu");
let Snippets = require("./Snippets");
let jsonStore = require("./jsonStore");
let JsonStore = require("./JsonStore");

module.exports = {
	init: ipcRenderer.sendSync("init", "init"),
	
	dialog,
	clipboard,
	contextMenu,
	jsonStore,
	prefs: new JsonStore("prefs"),
	snippets: new Snippets(),
	
	openDialogWindow(url, options) {
		return ipcRenderer.invoke("openDialogWindow", "open", url, options);
	},
	
	setWindowSize(width, height) {
		return ipcRenderer.invoke("windowSize", "set", width, height);
	},
};
