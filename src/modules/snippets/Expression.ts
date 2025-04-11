//import createExpressionFunction from "./createExpressionFunction";
import functions from "./functions";

class Expression {
	constructor(start, end, fn, name=null) {
		this.type = "expression";
		this.start = start;
		this.end = end;
		this.fn = fn;
		
		/*
		name - for simple @name expressions we might want to calculate the value
		some other way, e.g. for CodePatterns query captures
		
		TODO this should probably be made more generic -- since snippets is
		used by F&R and CP, call it placeholders or something and split the
		snippets-specific logic out
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

export default Expression;
