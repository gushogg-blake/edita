let selection = require("./selection");
let drop = require("./drop");
let astManipulations = require("./astManipulations");

module.exports = {
	selection,
	drop,
	astManipulations,
	
	astManipulationIsAvailable(astManipulation, document, selection) {
		return !astManipulation.isAvailable || astManipulation.isAvailable(document, selection);
	},
	
	getPickOptions(astMode, document, selection) {
		return Object.values(astMode.pickOptions).filter(pickOption => pickOption.isAvailable(document, selection));
	},
	
	getDropTargets(astMode, document, lineIndex) {
		return Object.values(astMode.dropTargets).filter(dropTarget => dropTarget.isAvailable(document, lineIndex));
	},
};
