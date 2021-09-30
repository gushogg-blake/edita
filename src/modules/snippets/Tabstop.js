class Tabstop {
	constructor(start, end, name, defaultFn) {
		this.type = "tabstop";
		this.start = start;
		this.end = end;
		this.name = name;
		this.defaultFn = defaultFn;
	}
	
	getDefaultValue(context) {
		return this.defaultFn ? this.defaultFn(functions, context) : "";
	}
}

module.exports = Tabstop;
