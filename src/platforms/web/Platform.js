let path = require("path-browserify");
let minimatch = require("minimatch-browser");
let bluebird = require("bluebird");
let get = require("lodash.get");
let set = require("lodash.set");

let Evented = require("utils/Evented");
let defaultPrefs = require("modules/defaultPrefs");

let fs = require("../common/modules/fs");
let clipboard = require("./modules/clipboard");

class Platform extends Evented {
	constructor() {
		super();
		
		this.systemInfo = {
			newline: "\n",
			homeDir: null,
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
		
		this.prefs = await this.loadPrefs() || defaultPrefs(this.systemInfo);
		this.snippets = await this.loadSnippets();
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
	
	setTitle(title) {
		// noop
	}
	
	loadTreeSitterLanguage(name) {
		return TreeSitter.Language.load("./vendor/tree-sitter/langs/" + name + ".wasm");
	}
	
	getPref(key) {
		return get(this.prefs, key);
	}
	
	setPref(key, value) {
		set(this.prefs, key, value);
		
		this.fire("prefsUpdated");
	}
	
	loadPrefs() {
		return null; //
	}
	
	loadSnippets() {
		return []; //
	}
	
	editSnippet(snippet) {
		
	}
	
	getSnippet(name) {
		return this.snippets.find(s => s.name === name);
	}
	
	loadSession() {
		return null; //
	}
	
	saveSession(session) {
		
	}
}

module.exports = Platform;
