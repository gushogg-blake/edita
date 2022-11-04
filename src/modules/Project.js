let maskOtherRegions = require("modules/utils/lsp/maskOtherRegions");
let LspClient = require("modules/lsp/LspClient");

class Project {
	constructor(dirs, config, isSaved) {
		this.dirs = dirs.map(dir => platform.fs(dir));
		this.config = config;
		this.isSaved = isSaved;
		
		this.lspServers = {};
		this.lspClient = new LspClient(this);
	}
	
	lspServerKey(langCode) {
		return langCode + ":" + this.key;
	}
	
	startLspServer(langCode) {
		let server = platform.lsp.start(this.lspServerKey(langCode), langCode, {
			workspaceFolders: this.dirs.map(dir => dir.path),
		});
		
		server.start().catch(e => console.error(e));
		
		this.lspServers[langCode] = server;
	}
	
	getLspServer(langCode) {
		if (!this.lspServers[langCode]) {
			this.startLspServer(langCode);
		}
		
		return this.lspServers[langCode];
	}
	
	closeLspServer(langCode) {
		delete this.lspServers[langCode];
		
		return platform.lsp.close(this.lspServerKey(langCode));
	}
	
	/*
	
	let code = maskOtherRegions(document, scope);
	
	await server.notify("textDocument/didOpen", {
		textDocument: {
			uri,
			languageId: lang.code,
			version: 1,
			text: code,
		},
	});
		
	await server.notify("textDocument/didClose", {
		textDocument: {
			uri,
		},
	});
	*/
	
	ownsUrl(url) {
		return this.dirs.some(dir => platform.fs(url.path).isDescendantOf(dir));
	}
	
	get key() {
		return [...this.dirs].map(dir => dir.path).sort().join("+");
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
