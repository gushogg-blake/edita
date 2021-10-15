let pickOptions = require("./pickOptions");
let dropTargets = require("./dropTargets");
let astManipulations = require("./astManipulations");
let generatePickOptions = require("./generatePickOptions");
let generateDropTargets = require("./generateDropTargets");

module.exports = {
	pickOptions,
	dropTargets,
	astManipulations,
	generatePickOptions,
	generateDropTargets,
	
	getAvailableAstManipulations(document, selection) {
		return Object.values(astManipulations).filter(function(manipulation) {
			return manipulation.isAvailable(document, selection);
		});
	},
	
	adjustSpaces(document, fromSelection, toSelection, selectionLines, insertLines) {
		console.log(document);
		console.log(fromSelection);
		console.log(toSelection);
		console.log(selectionLines);
		console.log(insertLines);
		
		return {
			above: 0,
			below: 0,
		};
	},
};
