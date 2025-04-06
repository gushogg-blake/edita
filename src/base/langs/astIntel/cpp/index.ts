import {AstIntel} from "modules/astIntel";
import pickOptions from "./pickOptions";
import dropTargets from "./dropTargets";
import astManipulations from "./astManipulations";

export default class extends AstIntel {
	pickOptions = pickOptions(this);
	dropTargets = dropTargets(this);
	astManipulations = astManipulations(this);
	
	isBlock(node) {
		return node.start.lineIndex !== node.end.lineIndex && [
			"function_definition",
		].includes(node.type);
	}
	
	getFooter(node) {
		let {parent} = node;
		
		if (
			parent
			&& this.isBlock(parent)
			&& node.equals(parent.firstChild)
			&& parent.lastChild.end.lineIndex > node.end.lineIndex
		) {
			return parent.lastChild;
		}
		
		return null;
	}
	
	getHeader(node) {
		let {parent} = node;
		
		if (
			parent
			&& this.isBlock(parent)
			&& node.equals(parent.lastChild)
			&& parent.firstChild.start.lineIndex < node.start.lineIndex
		) {
			return parent.firstChild;
		}
		
		return null;
	}
}
