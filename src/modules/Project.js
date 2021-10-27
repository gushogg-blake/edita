let Evented = require("utils/Evented");
let LspContext = require("modules/lsp/LspContext");

class Project extends Evented {
	constructor(dirs, implicit) {
		super();
		
		this.dirs = dirs;
		this.implicit = implicit;
		this.lspContext = new LspContext();
		
		this.init();
	}
	
	async init() {
		// TODO guess required langs and start lang servers
		
	}
	
	containsDir(dir) {
		return this.dirs.includes(dir);
	}
	
	registerDocument(document) {
		
	}
	
	unregisterDocument(document) {
		
	}
}

module.exports = Project;
