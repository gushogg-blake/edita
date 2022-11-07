let Evented = require("utils/Evented");

class Platform extends Evented {
	constructor() {
		super();
		
		this.isWeb = false;
	}
	
	confirm(message) {
		return confirm(message);
	}
}

module.exports = Platform;
