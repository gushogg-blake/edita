let Evented = require("utils/Evented");

class Tab extends Evented {
	constructor(app, type) {
		super();
		
		this.app = app;
		this.type = type;
	}
	
	async init() {
	}
	
	get isEditor() {
		return this.type === "editor";
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
	
	get windowTitle() {
		return this.name;
	}
	
	get label() {
		return this.app.getTabLabel(this);
	}
	
	get modified() {
		return false;
	}
	
	get closeable() {
		return true;
	}
	
	focus() {
	}
	
	show() {
	}
	
	hide() {
	}
	
	resize() {
	}
	
	select() {
	}
	
	saveState() {
		return null;
	}
	
	restoreState(details) {
	}
	
	teardown() {
		if (this.teardownCallbacks) {
			for (let fn of this.teardownCallbacks) {
				fn();
			}
		}
	}
}

module.exports = Tab;
