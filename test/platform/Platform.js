let defaultPrefs = require("modules/defaultPrefs");
let fs = require("./modules/fs");

class Platform {
	constructor() {
		this.systemInfo = {
			newline: "\n",
		};
		
		this.fs = fs;
		
		this.prefs = defaultPrefs(this.systemInfo);
	}
	
	async init() {
		
	}
	
	loadTreeSitterLanguage(name) {
		return TreeSitter.Language.load(fs(__dirname, "../../src/platforms/electron/public/vendor/tree-sitter/langs/tree-sitter-" + name + ".wasm").path);
	}
}

module.exports = Platform;
