let getVariableName = require("./getVariableName");
let functions = require("./functions");

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

module.exports = Tabstop;
