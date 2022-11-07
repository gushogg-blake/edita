let Evented = require("utils/Evented");

class Platform extends Evented {
	constructor() {
		super();
		
		this.supports = {
			openFromFilesystem: true,
			projects: true,
		};
	}
	
	confirm(message) {
		return confirm(message);
	}
}

module.exports = Platform;
