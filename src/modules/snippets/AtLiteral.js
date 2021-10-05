class AtLiteral {
	constructor(start, end) {
		this.type = "atLiteral";
		this.start = start
		this.end = end;
	}
	
	getDefaultValue(context) {
		return "@";
	}
}

module.exports = AtLiteral;
