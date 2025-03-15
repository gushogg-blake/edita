import getVariableName from "./getVariableName";
import functions from "./functions";

class Tabstop {
	constructor(start, end, name, defaultFn) {
		this.type = "tabstop";
		this.start = start;
		this.end = end;
		this.name = name;
		this.variableName = getVariableName(name);
		this.defaultFn = defaultFn;
	}
	
	getDefaultValue(context) {
		return this.defaultFn ? this.defaultFn(functions, context) : "";
	}
}

export default Tabstop;
