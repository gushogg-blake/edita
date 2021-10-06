//let fsWeb = require("fs-web/dist/fs");
let minimatch = require("minimatch-browser");
let bluebird = require("bluebird");
let get = require("lodash.get");
let set = require("lodash.set");

let path = require("vendor/path-browser");
let fsWeb = require("vendor/fs-web");

let Evented = require("utils/Evented");
let screenOffsets = require("utils/dom/screenOffsets");
let parentNodes = require("utils/dom/parentNodes");
let defaultPrefs = require("modules/defaultPrefs");
let contextMenu = require("modules/contextMenu");

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
			init: null,
			localStoragePrefix: "editor.",
			useSystemFocus: true,
			...options,
		};
		
		this.options = options;
		
		this.fs = fs({
			fs: fsWeb,
			path,
			minimatch,
			
			cwd() {
				return "/";
			},
		});
		
		this.prefs = this.loadJson("prefs") || defaultPrefs(this.systemInfo);
		this.snippets = new Snippets(options.localStoragePrefix);
		
		if (options.init) {
			await options.init();
		}
		
		document.body.addEventListener("contextmenu", function(e) {
			//3let node = e.target.parentElement;
			
			//while (node) {
			//	console.log(node);
			//	if (node.classList.contains("editor")) {
			//		e.preventDefault();
			//		
			//		break;
			//	}
			//	
			//	node = node.parentElement;
			//}
			for (let node of parentNodes(e.target)) {
				console.log(node);
				if (node.classList.contains("editor")) {
					e.preventDefault();
					
					break;
				}
			}
		});
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
	
	showContextMenu(e, items, noCancel=false) {
		contextMenu(items, {
			x: e.clientX,
			y: e.clientY,
		}, noCancel);
	}
	
	showContextMenuForElement(element, items, noCancel=false) {
		let {x, y, height} = screenOffsets(element);
		let coords = {x, y: y + height};
		
		contextMenu(items, coords, noCancel);
	}
	
	get useSystemFocus() {
		return this.options.useSystemFocus;
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
