import URL from "modules/utils/URL";
import Tab from "./Tab";

class FindAndReplaceTab extends Tab {
	constructor(app) {
		super(app, "findAndReplace");
		
		this._url = URL.fromString("special://find-and-replace");
		
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
