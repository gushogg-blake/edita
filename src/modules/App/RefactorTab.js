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
}

module.exports = RefactorTab;
