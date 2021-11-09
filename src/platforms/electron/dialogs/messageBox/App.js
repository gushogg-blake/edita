let Evented = require("utils/Evented");

class App extends Evented {
	constructor(options) {
		super();
		
		this.options = options;
	}
	
	async init() {
		document.title = this.options.title || "";
	}
	
	respond(buttonIndex) {
		platform.callOpener("messageBoxResponse", buttonIndex);
	}
	
	teardown() {
		
	}
}

module.exports = App;
