import pickOptions from "./pickOptions";
import dropTargets from "./dropTargets";
import astManipulations from "./astManipulations";

export default {
	pickOptions,
	dropTargets,
	astManipulations,
	
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
