let ipcRenderer = require("platform/modules/ipcRenderer");
let dialog = require("./dialog");
let clipboard = require("./clipboard");
let contextMenu = require("./contextMenu");
let Snippets = require("./Snippets");
let jsonStore = require("./_jsonStore");
let JsonStore = require("./JsonStore");
let lspServer = require("./lspServer");

module.exports = {
	init: ipcRenderer.sendSync("init", "init"),
	
	dialog,
	clipboard,
	contextMenu,
	jsonStore,
	lspServer,
	prefs: new JsonStore("prefs"),
	snippets: new Snippets(),
	
	openDialogWindow(name, dialogOptions) {
		return ipcRenderer.invoke("openDialogWindow", "open", name, dialogOptions);
	},
};
