import {AstIntel} from "modules/astIntel";
import pickOptions from "./pickOptions";
import dropTargets from "./dropTargets";
import astManipulations from "./astManipulations";

export default class extends AstIntel {
	pickOptions = pickOptions(this.lang);
	dropTargets = dropTargets(this.lang);
	astManipulations = astManipulations(this.lang);
	
	isBlock(node) {
		return node.start.lineIndex !== node.end.lineIndex && [
			"block",
		].includes(node.type);
	}
	
	getFooter(node) {
		let {parent} = node;
		
		if (
			parent
			&& this.isBlock(parent)
			&& node.equals(parent.firstChild)
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
		) {
			return parent.firstChild;
		}
		
		return null;
	}
}
