import {Special} from "modules/core/resources";
import Tab from "./Tab";

class FindResultsTab extends Tab {
	constructor(app, findResults) {
		super(app, Special.findResults());
		
		this.findResults = findResults;
		
		this.teardownCallbacks = [
		];
	}
	
	get closeable() {
		return false;
	}
	
	get name() {
		return "Find results";
	}
}

export default FindResultsTab;
