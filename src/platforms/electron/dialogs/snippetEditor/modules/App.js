let Evented = require("utils/Evented");

class App extends Evented {
	constructor(options) {
		super();
		
		this.options = options;
	}
	
	async init() {
		this.snippet = await platform.snippets.findById(this.options.snippetId);
	}
}

module.exports = App;
