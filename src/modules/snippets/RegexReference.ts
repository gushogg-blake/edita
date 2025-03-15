class RegexReference {
	constructor(start, end, index) {
		this.type = "expression";
		this.start = start;
		this.end = end;
		this.index = index;
	}
	
	getValue(context) {
		return context[this.index] || "";
	}
	
	getDefaultValue(context) {
		return this.getValue(context);
	}
}

export default RegexReference;
