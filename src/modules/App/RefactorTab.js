let URL = require("modules/URL");
let Tab = require("./Tab");

class RefactorTab extends Tab {
	constructor(app, refactor) {
		super(app, "refactor");
		
		this.refactor = refactor;
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
