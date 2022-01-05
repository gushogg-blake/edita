let Evented = require("utils/Evented");
let lspConfig = require("./modules/lspConfig");

class Platform extends Evented {
	constructor() {
		super();
		
		this.lspConfig = lspConfig;
	}
	
	confirm(message) {
		return confirm(message);
	}
}

module.exports = Platform;
