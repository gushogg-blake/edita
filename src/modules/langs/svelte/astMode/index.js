let pickOptions = require("./pickOptions");
let dropTargets = require("./dropTargets");
let generatePickOptions = require("./generatePickOptions");
let generateDropTargets = require("./generateDropTargets");
let drop = require("./drop");

module.exports = {
	pickOptions,
	dropTargets,
	generatePickOptions,
	generateDropTargets,
	drop,
	
	getAvailableAstManipulations() {
		return [];
	},
};
