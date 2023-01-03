let functions = require("./functions");

class Expression {
	constructor(start, end, fn, name=null) {
		this.type = "expression";
		this.start = start;
		this.end = end;
		this.fn = fn;
		
		/*
		name - for simple @name expressions we might want to calculate the value
		some other way, e.g. for codex query captures 
		*/
		
		this.name = name;
	}
	
	getValue(context) {
		try {
			return this.fn(functions, context) || "";
		} catch (e) {
			console.log(e);
			
			return "";
		}
	}
	
	getDefaultValue(context) {
		return this.getValue(context);
	}
}

module.exports = Expression;
