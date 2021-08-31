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
	
	getAvailableAstManipulations(lines, selection) {
		return Object.values(astManipulations).filter(function(manipulation) {
			return manipulation.isAvailable(lines, selection);
		});
	},
};
