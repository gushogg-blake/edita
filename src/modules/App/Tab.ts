import Evented from "utils/Evented";

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
	
	// part of the name that's there to disambiguate it from other
	// tabs, for files with the same name
	get disambiguator() {
		return "";
	}
	
	get windowTitle() {
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
