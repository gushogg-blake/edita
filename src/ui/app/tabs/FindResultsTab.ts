import {Special} from "core/resource";
import type {FindResults} from "ui/findResults";
import Tab from "./Tab";

export default class FindResultsTab extends Tab {
	private findResults: FindResults;
	
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
