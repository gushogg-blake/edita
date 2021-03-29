let Store = require("./Store");

module.exports = class extends Store {
	constructor(value) {
		super(value);
	}
	
	set(value) {
		this.value = value;
		
		for (let handler of this.handlers) {
			handler(value);
		}
	}
}
