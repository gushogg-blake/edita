let Evented = require("utils/Evented");

class Project extends Evented {
	constructor(dirs, implicit) {
		super();
		
		this.dirs = dirs;
		this.implicit = implicit;
		
		this.lspServersByLangCode = {};
		
		this.init();
	}
	
	async init() {
		// TODO guess required langs and start lang servers
		
	}
	
	containsDir(dir) {
		return this.dirs.includes(dir);
	}
	
	async lspRequest(langCode, method, params) {
		if (!this.lspServersByLangCode[langCode]) {
			await this.createLspServerForLangCode(langCode);
		}
		
		let server = this.lspServersByLangCode[langCode];
		
		return server.request(method, params);
	}
	
	registerDocument(document) {
		
	}
	
	unregisterDocument(document) {
		
	}
	
	async createLspServerForLangCode(langCode) {
		this.lspServersByLangCode[langCode] = await platform.createLspServer(langCode);
	}
}

module.exports = Project;
