let getOpenersAndClosersOnLine = require("./getOpenersAndClosersOnLine");
let astSelection = require("./astSelection");
let pickOptions = require("./pickOptions");
let dropTargets = require("./dropTargets");
let generatePickOptions = require("./generatePickOptions");
let generateDropTargets = require("./generateDropTargets");

module.exports = {
	pickOptions,
	dropTargets,
	getOpenersAndClosersOnLine,
	astSelection,
	generatePickOptions,
	generateDropTargets,
	
	drop(
		document,
		fromSelection,
		toSelection,
		lines,
		option,
		target,
	) {
		console.log(fromSelection, toSelection, lines, option, target);
	},
};
