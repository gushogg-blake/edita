import get from "lodash.get";
import set from "lodash.set";
import Evented from "utils/Evented";
import LspClient from "modules/lsp/LspClient";

function defaultConfig() {
	return {
		name: null,
		
		prefs: {
			findAndReplace: {
				excludePatterns: [],
			},
		},
	};
}

class Project extends Evented {
	constructor(dirs, config, isSaved) {
		super();
		
		this.dirs = dirs;
		this.config = config || defaultConfig();
		this.isSaved = isSaved;
		
		this.lspClient = new LspClient();
		
		this.relayEvents(this.lspClient, ["notification", "error"], "lsp.");
	}
	
	get prefs() {
		return this.config.prefs;
	}
	
	getPref(key) {
		return get(this.prefs, key);
	}
	
	setPref(key, value) {
		set(this.prefs, key, value);
	}
	
	tabCreated(tab) {
		this.lspClient?.registerDocument(tab.document);
	}
	
	tabClosed(tab) {
		this.lspClient?.unregisterDocument(tab.document);
	}
	
	ownsUrl(url) {
		return this.dirs.some(dir => platform.fs(url.path).isDescendantOf(dir));
	}
	
	get key() {
		return [...this.dirs].sort().join("+");
	}
	
	async save() {
		await base.stores.projects.save(this.key, this.toJSON());
	}
	
	toJSON() {
		let {dirs, config} = this;
		
		return {dirs, config};
	}
	
	static fromJson({dirs, config}) {
		return new Project(dirs, config, true);
	}
}

export default Project;
