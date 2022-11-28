let get = require("lodash.get");
let set = require("lodash.set");
let Evented = require("utils/Evented");
let normaliseLangCode = require("modules/lsp/utils/normaliseLangCode");
let LspClient = require("modules/lsp/LspClient");

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
		
		this.lspServers = {};
		this.lspClient = new LspClient(this);
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
	
	lspServerKey(langCode) {
		return langCode + ":" + this.key;
	}
	
	startLspServer(langCode) {
		let server = platform.lsp.start(this.lspServerKey(langCode), langCode, {
			workspaceFolders: this.dirs,
		});
		
		server.start().catch(e => console.error(e));
		
		server.on("notification", this.onLspNotification.bind(this, server));
		
		this.lspServers[langCode] = server;
	}
	
	getLspServer(langCode) {
		if (!platform.lsp) {
			return null;
		}
		
		langCode = normaliseLangCode(langCode);
		
		if (!this.lspServers[langCode]) {
			this.startLspServer(langCode);
		}
		
		return this.lspServers[langCode];
	}
	
	closeLspServer(langCode) {
		langCode = normaliseLangCode(langCode);
		
		delete this.lspServers[langCode];
		
		return platform.lsp.close(this.lspServerKey(langCode));
	}
	
	onLspNotification(server, notification) {
		this.fire("lspNotification", {
			server,
			notification,
		});
	}
	
	tabCreated(tab) {
		this.lspClient.registerDocument(tab.document);
	}
	
	tabClosed(tab) {
		this.lspClient.unregisterDocument(tab.document);
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

module.exports = Project;
