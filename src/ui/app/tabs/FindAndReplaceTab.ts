import {Special} from "core/resource";
import Tab from "./Tab";

export default class FindAndReplaceTab extends Tab {
	constructor(app) {
		super(app, Special.findAndReplace());
		
		this.findAndReplace = app.findAndReplace;
		
		this.teardownCallbacks = [
		];
	}
	
	async init() {
		
	}
	
	get name() {
		return "Find & replace";
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
