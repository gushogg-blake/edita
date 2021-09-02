let fs = require("./modules/fs");

class Platform {
	constructor() {
		this.systemInfo = {
			newline: "\n",
		};
		
		this.fs = fs;
	}
	
	loadTreeSitterLanguage(name) {
		return TreeSitter.Language.load(fs(__dirname, "./public/vendor/tree-sitter/langs/" + name + ".wasm").path);
	}
}

module.exports = Platform;
