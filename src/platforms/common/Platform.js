let get = require("lodash.get");
let set = require("lodash.set");
let Evented = require("utils/Evented");
let defaultPrefs = require("modules/defaultPrefs");
let lspConfig = require("./modules/lspConfig");

class Platform extends Evented {
	constructor() {
		super();
		
		this.lspConfig = lspConfig;
	}
	
	async init() {
		let {JsonStore} = this;
		
		this.jsonStores = {
			prefs: new JsonStore("prefs", defaultPrefs(this.systemInfo)),
			findAndReplaceOptions: new JsonStore("findAndReplaceOptions", {}),
			fileTree: new JsonStore("fileTree"),
			session: new JsonStore("session"),
			perFilePrefs: new JsonStore("perFilePrefs"),
		};
		
		this.prefs = await this.jsonStores.prefs.load();
	}
	
	confirm(message) {
		return confirm(message);
	}
	
	getPref(key) {
		return get(this.prefs, key);
	}
	
	setPref(key, value) {
		set(this.prefs, key, value);
		
		this.jsonStores.prefs.save(this.prefs);
	}
	
	resetPrefs() {
		this.prefs = defaultPrefs(this.systemInfo);
		
		this.jsonStores.prefs.save(this.prefs);
		
		this.fire("prefsUpdated");
	}
}

module.exports = Platform;
