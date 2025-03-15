import selection from "./selection";
import drop from "./drop";
import astManipulations from "./astManipulations";
import removeSelection from "./removeSelection";
import {getHeaderLineIndex, getFooterLineIndex} from "./utils";

export default {
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
