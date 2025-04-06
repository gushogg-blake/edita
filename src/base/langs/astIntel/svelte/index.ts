import {AstIntel} from "modules/astIntel";
import pickOptions from "./pickOptions";
import dropTargets from "./dropTargets";
import astManipulations from "./astManipulations";

export default class extends AstIntel {
	pickOptions = pickOptions(this);
	dropTargets = dropTargets(this);
	astManipulations = astManipulations(this);
	
	getFooter(node) {
		return null;
	}
	
	getHeader(node) {
		return null;
	}
}
