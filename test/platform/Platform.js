let fs = require("flowfs");

class Platform {
	constructor() {
		this.systemInfo = {
			newline: "\n",
		};
	}
	
	loadTreeSitterLanguage(name) {
		return TreeSitter.Language.load(fs(__dirname, "./public/vendor/tree-sitter/langs/" + name + ".wasm").path);
	}
}

module.exports = Platform;
