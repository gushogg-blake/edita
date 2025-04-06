import {AstIntel} from "modules/astIntel";
import pickOptions from "./pickOptions";
import dropTargets from "./dropTargets";
import astManipulations from "./astManipulations";

export default class extends AstIntel {
	pickOptions = pickOptions(this.lang);
	dropTargets = dropTargets(this.lang);
	astManipulations = astManipulations(this.lang);
	
	isElementBlock(node) {
		return (
			[
				"element",
				"style_element",
				"script_element",
			].includes(node.type)
			&& node.firstChild.end.lineIndex !== node.lastChild.start.lineIndex
		);
	}
	
	getFooter(node) {
		let {parent} = node;
		
		if (
			node.type === "start_tag"
			&& this.isElementBlock(parent)
		) {
			return parent.lastChild;
		}
		
		return null;
	}
	
	getHeader(node) {
		let {parent} = node;
		
		if (
			node.type === "end_tag"
			&& this.isElementBlock(parent)
		) {
			return parent.firstChild;
		}
		
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
