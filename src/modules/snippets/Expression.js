let functions = require("./functions");

class Expression {
	constructor(start, end, fn) {
		this.type = "expression";
		this.start = start;
		this.end = end;
		this.fn = fn;
	}
	
	getValue(context) {
		return this.fn(functions, context) || "";
	}
	
	getDefaultValue(context) {
		return this.getValue(context);
	}
}

module.exports = Expression;
