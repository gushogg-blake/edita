let URL = require("modules/URL");
let Tab = require("./Tab");

class RefactorTab extends Tab {
	constructor(app, options) {
		super(app, "refactor");
		
		this.options = options;
		this._url = new URL("special://refactor");
		
		this.teardownCallbacks = [
		];
	}
	
	get url() {
		return this._url;
	}
	
	async init() {
		
	}
}

module.exports = RefactorTab;
