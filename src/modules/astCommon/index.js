let selection = require("./selection");
let drop = require("./drop");

module.exports = {
	selection,
	drop,
	
	getPickOptions(astMode, document, selection) {
		return Object.values(astMode.pickOptions).filter(pickOption => pickOption.isAvailable(document, selection));
	},
	
	getDropTargets(astMode, document, lineIndex) {
		return Object.values(astMode.dropTargets).filter(dropTarget => dropTarget.isAvailable(document, lineIndex));
	},
};
