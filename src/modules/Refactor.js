let Evented = require("utils/Evented");

class Refactor extends Evented {
	constructor(options) {
		super();
		
		this.setOptions(options);
	}
	
	setOptions(options) {
		this.options = options;
	}
}

module.exports = Refactor;
