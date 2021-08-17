let path = require("path-browserify");
let minimatch = require("minimatch-browser");
let bluebird = require("bluebird");
let fs = require("../common/modules/fs");
let clipboard = require("./modules/clipboard");

class Platform {
	constructor() {
		this.systemInfo = {
			newline: "\n",
		};
		
		this.clipboard = clipboard;
		
		this.path = path;
	}
	
	async init(options) {
		this.fs = fs({
			fs: {
				
			},
			
			path,
			minimatch,
			
			cwd() {
				return "/";
			},
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
		return TreeSitter.Language.load("./vendor/tree-sitter/langs/" + name + ".wasm");
	}
}

module.exports = Platform;
