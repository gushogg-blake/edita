let minimatch = require("minimatch-browser");
let bluebird = require("bluebird");
let get = require("lodash.get");
let set = require("lodash.set");

let Evented = require("utils/Evented");
let defaultPrefs = require("modules/defaultPrefs");

let fs = require("../common/modules/fs");
let path = require("../common/modules/path-browser");
let clipboard = require("./modules/clipboard");
let localStorage = require("./modules/localStorage");

class Platform extends Evented {
	constructor() {
		super();
		
		this.systemInfo = {
			newline: "\n",
			homeDir: "/",
		};
		
		this.isMainWindow = true;
		
		this.clipboard = clipboard;
		this.path = path;
	}
	
	async init(options) {
		options = {
			localStoragePrefix: "editor.",
			...options,
		};
		
		this.fs = fs({
			fs: {
				
			},
			
			path,
			minimatch,
			
			cwd() {
				return "/";
			},
		});
		
		this.prefs = this.loadJson("prefs") || defaultPrefs(this.systemInfo);
		this.snippets = await this.loadSnippets();
	}
	
	async open(defaultPath, currentPath) {
		
	}
	
	async save(path, code) {
		
	}
	
	async saveAs() {
		
	}
	
	findInFiles(path, inAppFallback) {
		inAppFallback(path);
	}
	
	findAndReplaceInFiles(path, inAppFallback) {
		inAppFallback(path);
	}
	
	editSnippet(snippet, inAppFallback) {
		inAppFallback(snippet);
	}
	
	async filesFromDropEvent(e) {
		return bluebird.map([...e.dataTransfer.files], async function(file) {
			return {
				path: path.resolve("/", file.name),
				code: await file.text(),
			};
		});
	}
	
	getFilesToOpenOnStartup() {
		return [];
	}
	
	showMessageBox(options) {
		
	}
	
	showContextMenu(e, items) {
		
	}
	
	setTitle(title) {
		// noop
	}
	
	loadTreeSitterLanguage(name) {
		return TreeSitter.Language.load("./vendor/tree-sitter/langs/tree-sitter-" + name + ".wasm");
	}
	
	getPref(key) {
		return get(this.prefs, key);
	}
	
	setPref(key, value) {
		set(this.prefs, key, value);
		
		this.saveJson("prefs", this.prefs);
		
		this.fire("prefsUpdated");
	}
	
	loadSnippets() {
		return []; //
	}
	
	getSnippet(name) {
		return this.snippets.find(s => s.name === name);
	}
	
	loadJson(key) {
		return localStorage.get(this.options.localStoragePrefix + key);
	}
	
	saveJson(key, data) {
		localStorage.set(this.options.localStoragePrefix + key, data);
	}
	
	closeWindow() {
		// noop
	}
}

module.exports = Platform;
