import URL from "modules/utils/URL";
import Tab from "./Tab";

class FindResultsTab extends Tab {
	constructor(app, findResults) {
		super(app, "findResults");
		
		this.findResults = findResults;
		this._url = URL.fromString("special://find-results");
		
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

export default FindResultsTab;
