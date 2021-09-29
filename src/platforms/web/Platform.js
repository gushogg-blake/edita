let minimatch = require("minimatch-browser");
let bluebird = require("bluebird");
let get = require("lodash.get");
let set = require("lodash.set");

let path = require("vendor/path-browser");

let Evented = require("utils/Evented");
let defaultPrefs = require("modules/defaultPrefs");

let fs = require("../common/modules/fs");
let clipboard = require("./modules/clipboard");
let localStorage = require("./modules/localStorage");
let Snippets = require("./modules/Snippets");

class Platform extends Evented {
	constructor() {
		super();
		
		this.systemInfo = {
			newline: "\n",
			homeDir: "/",
			multiPathSeparator: ":",
		};
		
		this.isMainWindow = true;
		
		this.clipboard = clipboard;
		this.path = path;
		this.walk = null;
	}
	
	async init(options) {
		options = {
			localStoragePrefix: "editor.",
			...options,
		};
		
		this.options = options;
		
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
		this.snippets = new Snippets(options.localStoragePrefix);
	}
	
	async open(defaultPath, currentPath) {
		
	}
	
	async save(path, code) {
		
	}
	
	async saveAs() {
		
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
	
	openDialogWindow(app, dialog, dialogOptions, windowOptions) {
		app.openDialogWindow(dialog, dialogOptions, windowOptions);
	}
	
	showMessageBox(options) {
		
	}
	
	showContextMenu(e, items) {
		
	}
	
	handleIpcMessages(channel, handler) {
		// noop
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
	
	resetPrefs() {
		this.prefs = defaultPrefs(this.systemInfo);
		
		this.saveJson("prefs", this.prefs);
		
		this.fire("prefsUpdated");
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
