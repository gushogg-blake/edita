let Evented = require("utils/Evented");

class Tab extends Evented {
	constructor(app, type) {
		super();
		
		this.app = app;
		this.type = type;
	}
	
	async init() {
	}
	
	get url() {
		return null;
	}
	
	get path() {
		return this.url?.path;
	}
	
	get protocol() {
		return this.url?.protocol;
	}
	
	get name() {
		return this.app.getTabName(this);
	}
	
	saveState() {
		return null;
	}
	
	restoreState(details) {
	}
	
	teardown() {
		for (let fn of this.teardownCallbacks) {
			fn();
		}
	}
}

module.exports = Tab;
