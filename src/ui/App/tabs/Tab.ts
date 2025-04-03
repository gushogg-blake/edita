import Evented from "utils/Evented";

class Tab<EventMap> extends Evented<EventMap> {
	constructor(app, resource) {
		super();
		
		this.app = app;
		this.resource = resource;
	}
	
	async init() {
	}
	
	get isEditor() {
		return ["file:", "new:"].includes(this.protocol);
	}
	
	get url() {
		return this.resource.url;
	}
	
	get protocol() {
		return this.url.protocol;
	}
	
	get path() {
		return this.url.path;
	}
	
	get isSaved() {
		return false;
	}
	
	get name() {
		throw new Error("tab name must be overridden");
	}
	
	// part of the name that's there to disambiguate it from other
	// tabs, for files with the same name
	get disambiguator() {
		return "";
	}
	
	get windowTitle(): string {
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
