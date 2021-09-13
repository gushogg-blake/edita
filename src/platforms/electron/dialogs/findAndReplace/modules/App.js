let bluebird = require("bluebird");
let Evented = require("utils/Evented");

class App extends Evented {
	constructor(options) {
		super();
		
		this.options = options;
	}
	
	async init() {
		
	}
}

module.exports = App;
