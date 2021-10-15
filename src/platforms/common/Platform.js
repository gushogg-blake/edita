let Evented = require("utils/Evented");

class Platform extends Evented {
	constructor() {
		super();
	}
	
	confirm(message) {
		return confirm(message);
	}
}

module.exports = Platform;
