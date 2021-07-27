let JavaScript = require("tree-sitter-javascript");

let treeSitterLangs = {
	javascript: JavaScript,
};

class Platform {
	constructor() {
		this.systemInfo = {
			newline: "\n",
		};
	}
	
	loadTreeSitterLanguage(name) {
		return treeSitterLangs[name];
	}
}

module.exports = Platform;
