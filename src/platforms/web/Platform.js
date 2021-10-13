let minimatch = require("minimatch-browser");
let bluebird = require("bluebird");
let get = require("lodash.get");
let set = require("lodash.set");

let path = require("vendor/path-browser");
let fsWeb = require("vendor/fs-web");

let screenOffsets = require("utils/dom/screenOffsets");
let parentNodes = require("utils/dom/parentNodes");
let {on} = require("utils/dom/domEvents");
let loadScript = require("utils/dom/loadScript");
let loadCss = require("utils/dom/loadCss");
let defaultPrefs = require("modules/defaultPrefs");
let contextMenu = require("modules/contextMenu");
let createFs = require("modules/fs");

let Common = require("platforms/common/Platform");

let clipboard = require("./modules/clipboard");
let localStorage = require("./modules/localStorage");
let Snippets = require("./modules/Snippets");

class Platform extends Common {
	constructor() {
		super();
		
		this.systemInfo = {
			newline: "\n",
			homeDir: "/",
			multiPathSeparator: ":",
		};
		
		this.clipboard = clipboard;
		this.isMainWindow = true;
		this.path = path;
		this.walk = null;
		
		this.useFileUploader = true;
	}
	
	async init(options) {
		options = {
			resourcePrefix: "",
			init: null,
			localStoragePrefix: "editor.",
			fsPrefix: "editorFs",
			...options,
		};
		
		this.options = options;
		
		await Promise.all([
			loadCss(options.resourcePrefix + "/global.css"),
			loadCss(options.resourcePrefix + "/main.css"),
			loadScript(options.resourcePrefix + "/vendor/tree-sitter/tree-sitter.js"),
		]);
		
		this.fs = this.createFs("files");
		
		this.prefs = this.loadJson("prefs") || defaultPrefs(this.systemInfo);
		
		this.snippets = new Snippets(this.createFs("snippets"));
		
		await this.snippets.init();
		
		if (options.init) {
			await options.init();
		}
		
		on(document.body, "contextmenu", function(e) {
			for (let node of parentNodes(e.target)) {
				if (node.classList.contains("editor")) {
					e.preventDefault();
					
					break;
				}
			}
		});
	}
	
	createFs(key) {
		let backend = fsWeb(this.options.fsPrefix + "-" + key);
		
		let fs = createFs({
			fs: backend,
			path,
			minimatch,
			
			async mkdirp(path) {
				let dirs = path.substr(1).split("/");
				
				for (let i = 1; i <= dirs.length; i++) {
					let path = "/" + dirs.slice(0, i).join("/");
					
					if (!await fs(path).exists()) {
						await backend.mkdir(path);
					}
				}
			},
			
			cwd() {
				return "/";
			},
	
			watch(path, handler) {
				return backend.watch(path, handler);
			},
		});
		
		return fs;
	}
	
	async save(path, code) {
		await this.fs(path).write(code);
	}
	
	saveAs() {
		let name = (prompt("Filename:") || "").replaceAll("/", "").trim();
		
		return name ? "/" + name : null;
	}
	
	backup(path, code) {
		let name = (path || "(new file)").replaceAll("/", "_");
		
		this.fs("/backups", name).write(code, {
			mkdirp: true,
		});
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
	
	handleIpcMessages(channel, handler) {
		// noop
	}
	
	setTitle(title) {
		// noop
	}
	
	loadTreeSitterLanguage(name) {
		return TreeSitter.Language.load(this.options.resourcePrefix + "/vendor/tree-sitter/langs/tree-sitter-" + name + ".wasm");
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
