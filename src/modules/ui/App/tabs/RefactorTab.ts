import URL from "modules/utils/URL";
import Tab from "./Tab";

class RefactorTab extends Tab {
	constructor(app, refactor) {
		super(app, "refactor");
		
		this.refactor = refactor;
		this._url = URL.fromString("special://refactor");
		
		this.teardownCallbacks = [
		];
	}
	
	async init() {
		
	}
	
	get name() {
		return "Refactor";
	}
	
	get url() {
		return this._url;
	}
	
	focus() {
		
	}
	
	show() {
		this.refactor.show();
	}
	
	hide() {
		this.refactor.hide();
	}
	
	resize() {
		this.refactor.resize();
	}
	
	select() {
		this.refactor.select();
	}
	
	teardown() {
		super.teardown();
		
		this.refactor.teardown();
	}
}

export default RefactorTab;
