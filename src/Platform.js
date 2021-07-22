let {systemInfo} = require("./modules/ipc/init/renderer");

class Platform {
	constructor() {
		this.systemInfo = systemInfo;
	}
	
	loadTreeSitterLanguage(name) {
		return TreeSitter.Language.load(fs(__dirname, "../../../../vendor/tree-sitter/langs/" + name + ".wasm").path); // TODO portability (file path)
	}
}

module.exports = Platform;
