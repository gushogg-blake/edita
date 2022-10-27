let maskOtherRegions = require("modules/utils/lsp/maskOtherRegions");
let LspClient = require("modules/lsp/LspClient");

class Project {
	constructor(dirs, config, isSaved) {
		this.dirs = dirs.map(dir => platform.fs(dir));
		this.config = config;
		this.isSaved = isSaved;
		
		this.lspServers = {};
		this.lspServerPromises = {};
		this.lspClient = new LspClient(this);
	}
	
	createLspServer(langCode) {
		let promise = platform.createLspServer(langCode, {
			workspaceFolders: this.dirs,
		});
		
		promise.then((server) => {
			this.lspServers[langCode] = server;
			
			server.on("exit", () => {
				delete this.lspServers[langCode];
				
				// TODO re-create
			});
		});
		
		promise.finally(() => delete this.lspServerPromises[langCode]);
		
		this.lspServerPromises[langCode] = promise;
	}
	
	async getLspServer(langCode) {
		if (!this.lspServers[langCode]) {
			if (!this.lspServerPromises[langCode]) {
				this.createLspServer(langCode);
			}
			
			await this.lspServerPromises[langCode];
		}
		
		return this.lspServers[langCode];
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
}

module.exports = Project;
