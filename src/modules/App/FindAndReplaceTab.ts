import URL from "modules/URL";
import Tab from "./Tab";

class FindAndReplaceTab extends Tab {
	constructor(app) {
		super(app, "findAndReplace");
		
		this._url = new URL("special://find-and-replace");
		
		this.findAndReplace = app.findAndReplace;
		
		this.teardownCallbacks = [
		];
	}
	
	async init() {
		
	}
	
	get name() {
		return "Find & replace";
	}
	
	get url() {
		return this._url;
	}
	
	get closeable() {
		return false;
	}
	
	focus() {
		this.findAndReplace.requestFocus();
	}
	
	show() {
		
	}
	
	hide() {
		
	}
}

export default FindAndReplaceTab;
