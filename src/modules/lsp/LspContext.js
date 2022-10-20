class LspContext {
	constructor() {
		this.createServerPromises = {};
		this.serversByLangCode = {};
	}
	
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
	
	async request(langCode, method, params) {
		if (!this.serversByLangCode[langCode]) {
			await this.createServerForLangCode(langCode);
		}
		
		let server = this.serversByLangCode[langCode];
		
		return server.request(method, params);
	}
	
	async notify(langCode, method, params) {
		if (!this.serversByLangCode[langCode]) {
			await this.createServerForLangCode(langCode);
		}
		
		let server = this.serversByLangCode[langCode];
		
		server.notify(method, params);
	}
}

module.exports = LspContext;
