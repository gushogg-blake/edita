class AtLiteral {
	constructor(start, end) {
		this.type = "expression";
		this.start = start
		this.end = end;
	}
	
	getValue(context) {
		return "@";
	}
	
	getDefaultValue(context) {
		return "@";
	}
}

module.exports = AtLiteral;
