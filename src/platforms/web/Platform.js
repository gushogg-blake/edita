let path = require("path-browserify");
let minimatch = require("minimatch-browser");
let bluebird = require("bluebird");
let Evented = require("utils/Evented");
let fs = require("../common/modules/fs");
let clipboard = require("./modules/clipboard");

class Platform extends Evented {
	constructor() {
		super();
		
		this.systemInfo = {
			newline: "\n",
		};
		
		this.isMainWindow = true;
		
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
	
	showContextMenu(e, items) {
		
	}
	
	loadTreeSitterLanguage(name) {
		return TreeSitter.Language.load("./vendor/tree-sitter/langs/" + name + ".wasm");
	}
	
	async loadSnippets() {
		return [];
	}
}

module.exports = Platform;
