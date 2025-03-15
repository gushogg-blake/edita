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
	
	get isFile() {
		return this.url?.isFile;
	}
	
	get name() {
		throw new Error("tab name must be overridden");
	}
	
	get windowTitle() {
		return this.name;
	}
	
	get label() {
		return this.name;
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

export default Tab;
