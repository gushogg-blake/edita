let bluebird = require("bluebird");
let fs = require("./modules/fs");

class Platform {
	constructor() {
		this.systemInfo = {
			newline: "\n",
		};
		
		this.clipboard = {
			write() {
			},
			
			writeSelection() {
			},
			
			read() {
				return "";
			},
			
			readSelection() {
				return "";
			},
		};
		
		this.fs = fs({
			
		});
	}
	
	async open(defaultPath, currentPath) {
		
	}
	
	async save(path, code) {
		
	}
	
	async saveAs() {
		
	}
	
	showMessageBox(options) {
		
	}
	
	showContextMenu(items) {
		
	}
	
	loadTreeSitterLanguage(name) {
		return TreeSitter.Language.load("../../../../vendor/tree-sitter/langs/" + name + ".wasm");
	}
}

module.exports = Platform;
