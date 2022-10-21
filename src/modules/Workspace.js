let maskOtherRegions = require("modules/utils/lsp/maskOtherRegions");
let LspClient = require("modules/lsp/LspClient");

class Workspace {
	constructor(dirs) {
		this.dirs = dirs;
		
		this.lspServers = {};
		this.lspClient = new LspClient(this);
	}
	
	async getLspServer(lang) {
		if (this.lspServers[lang]) {
			return this.lspServers[lang];
		}
		
		
	}
	
	/*
	async createServerForLangCode(langCode) {
		if (this.createServerPromises[langCode]) {
			return await this.createServerPromises[langCode];
		}
		
		let promise = platform.lsp.createServer(langCode, null, []);
		
		this.createServerPromises[langCode] = promise;
		
		let server = await promise;
		
		server.on("exit", () => delete this.serversByLangCode[langCode]);
		
		this.serversByLangCode[langCode] = server;
		
		delete this.createServerPromises[langCode];
	}
	*/
	
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
}

module.exports = Workspace;
