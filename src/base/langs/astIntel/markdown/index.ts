import {AstIntel} from "modules/astIntel";
import pickOptions from "./pickOptions";
import dropTargets from "./dropTargets";
import astManipulations from "./astManipulations";

export default class extends AstIntel {
	pickOptions = pickOptions(this.lang);
	dropTargets = dropTargets(this.lang);
	astManipulations = astManipulations(this.lang);
	
	getFooter(node) {
		return null;
	}
	
	getHeader(node) {
		return null;
	}
	
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
	}
}
