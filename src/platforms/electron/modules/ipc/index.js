let init = require("./init");
let dialog = require("./dialog");
let clipboard = require("./clipboard");
let contextMenu = require("./contextMenu");
let openDialogWindow = require("./openDialogWindow");
let snippets = require("./snippets");
let jsonStore = require("./jsonStore");
let JsonStore = require("./JsonStore");

module.exports = {
	init,
	dialog,
	clipboard,
	contextMenu,
	openDialogWindow,
	jsonStore,
	prefs: new JsonStore("prefs"),
	snippets,
};
