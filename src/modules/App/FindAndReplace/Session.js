let getPaths = require("./getPaths");
let getFindAndReplaceOptions = require("./getFindAndReplaceOptions");

class Session {
	constructor(options) {
		this.options = options;
		this.findAndReplaceOptions = getFindAndReplaceOptions(options);
	}
	
	async init() {
		this.paths = await getPaths(this.options);
		
		
	}
}

module.exports = Session;
