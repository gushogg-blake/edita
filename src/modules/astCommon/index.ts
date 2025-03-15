let selection = require("./selection");
let drop = require("./drop");
let astManipulations = require("./astManipulations");
let removeSelection = require("./removeSelection");
let {getHeaderLineIndex, getFooterLineIndex} = require("./utils");

module.exports = {
	selection,
	drop,
	astManipulations,
	removeSelection,
	getHeaderLineIndex,
	getFooterLineIndex,
	
	astManipulationIsAvailable(astManipulation, document, selection) {
		return !astManipulation.isAvailable || astManipulation.isAvailable(document, selection);
	},
	
	getPickOptions(astMode, document, lineIndex) {
		return Object.values(astMode.pickOptions).filter(pickOption => pickOption.isAvailable(document, lineIndex));
	},
	
	getDropTargets(astMode, document, lineIndex) {
		return Object.values(astMode.dropTargets).filter(dropTarget => dropTarget.isAvailable(document, lineIndex));
	},
};
