import {AstIntel} from "modules/astIntel";
import pickOptions from "./pickOptions";
import dropTargets from "./dropTargets";
import astManipulations from "./astManipulations";

export default class extends AstIntel {
	pickOptions = pickOptions;
	dropTargets = dropTargets;
	astManipulations = astManipulations;
	
	getFooter(node) {
		return null;
	}
	
	getHeader(node) {
		return null;
	}
}
