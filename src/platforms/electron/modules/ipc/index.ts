let ipcRenderer = require("platform/modules/ipcRenderer");
let dialog = require("./dialog");
let clipboard = require("./clipboard");
let jsonStore = require("./jsonStore");
let contextMenu = require("./contextMenu");
let Snippets = require("./Snippets");
let lsp = require("./lsp");

module.exports = {
	init: ipcRenderer.sendSync("init", "init"),
	
	dialog,
	clipboard,
	jsonStore,
	contextMenu,
	lsp,
	snippets: new Snippets(),
	
	openDialogWindow(name, dialogOptions) {
		return ipcRenderer.invoke("openDialogWindow", "open", name, dialogOptions);
	},
};
