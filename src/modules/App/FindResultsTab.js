let URL = require("modules/URL");
let Tab = require("./Tab");

class FindResultsTab extends Tab {
	constructor(app, findResults) {
		super(app, "findResults");
		
		this.findResults = findResults;
		this._url = new URL("special://find-results");
		
		this.teardownCallbacks = [
		];
	}
	
	get closeable() {
		return false;
	}
	
	get name() {
		return "Find results";
	}
	
	get url() {
		return this._url;
	}
}

module.exports = FindResultsTab;
