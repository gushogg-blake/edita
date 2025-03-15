let bindFunctions = require("utils/bindFunctions");
let createDialogComponent = require("./createDialogComponent");
let openDialogWindow = require("./openDialogWindow");

module.exports = function(app) {
	let _createDialogComponent = bindFunctions(app, createDialogComponent);
	let _openDialogWindow = openDialogWindow(app, _createDialogComponent);
	
	return _openDialogWindow;
}
