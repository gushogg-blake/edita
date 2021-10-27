class LspContext {
	constructor() {
		this.serversByLangCode = {};
	}
	
	async createServerForLangCode(langCode) {
		let server = await platform.lsp.createServer(langCode, null, []);
		
		server.on("exit", () => delete this.serversByLangCode[langCode]);
		
		this.serversByLangCode[langCode] = server;
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
