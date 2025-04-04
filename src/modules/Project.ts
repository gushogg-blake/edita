import get from "lodash.get";
import set from "lodash.set";
import {Evented} from "utils";
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
	lspClient: LspClient;
	isSaved: boolean;
	dirs: string[];
	config: any;
	
	constructor(dirs, config, isSaved) {
		super();
		
		this.dirs = dirs;
		this.config = config || defaultConfig();
		this.isSaved = isSaved;
		
		this.lspClient = new LspClient();
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
		await base.stores.projects.createOrUpdate(this.key, this.toJSON());
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
