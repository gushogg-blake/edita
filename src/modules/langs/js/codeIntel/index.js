let getOpenersAndClosersOnLine = require("./getOpenersAndClosersOnLine");
let astSelection = require("./astSelection");
let generatePickOptions = require("./generatePickOptions");
let generateDropTargets = require("./generateDropTargets");

module.exports = {
	getOpenersAndClosersOnLine,
	astSelection,
	generatePickOptions,
	generateDropTargets,
	
	pickOptions: {
		test: {
			label: "Test",
		},
	},
	
	dropTargets: {
		addSelectionToNewElse: {
			label: "+ else",
		},
		
		addSelectionToNewElseIf: {
			label: "+ else if",
		},
	},
	
	drop(fromSelection, toSelection, option, target) {
		
	},
};
