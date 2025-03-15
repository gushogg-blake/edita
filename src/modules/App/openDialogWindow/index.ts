let bindFunctions = require("utils/bindFunctions");
let createDialogComponent = require("./createDialogComponent");
let openDialogWindow = require("./openDialogWindow");

export default function(app) {
	let _createDialogComponent = bindFunctions(app, createDialogComponent);
	let _openDialogWindow = openDialogWindow(app, _createDialogComponent);
	
	return _openDialogWindow;
}
