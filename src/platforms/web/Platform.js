let minimatch = require("minimatch-browser");
let bluebird = require("bluebird");

let createFs = require("utils/fs");

let path = require("vendor/path-browser");
let fsWeb = require("vendor/fs-web");

let Evented = require("utils/Evented");
let screenOffsets = require("utils/dom/screenOffsets");
let {on} = require("utils/dom/domEvents");
let loadScript = require("utils/dom/loadScript");
let loadCss = require("utils/dom/loadCss");
let contextMenu = require("modules/contextMenu");

let clipboard = require("platform/modules/clipboard");
let jsonStore = require("platform/modules/jsonStore");
let Snippets = require("platform/modules/Snippets");
let lsp = require("platform/modules/lsp");

class Platform extends Evented {
	constructor() {
		super();
		
		this.isWeb = true;
		
		this.systemInfo = {
			newline: "\n",
			homeDir: "/",
			pathSeparator: "/",
			multiPathSeparator: ":",
		};
		
		this.clipboard = clipboard;
		this.isMainWindow = true;
		this.path = path;
	}
	
	async init(config) {
		config = {
			dev: false,
			resourcePrefix: "",
			localStoragePrefix: "edita.",
			fsPrefix: "editaFs",
			lspUrl: null,
			test: false,
			...config,
		};
		
		this.config = config;
		
		this.jsonStore = jsonStore(config.localStoragePrefix);
		
		await Promise.all([
			!config.test && loadCss(config.resourcePrefix + "css/global.css"),
			!config.test && loadCss(config.resourcePrefix + "js/main.css"),
			loadScript(config.resourcePrefix + "vendor/tree-sitter/tree-sitter.js"),
		]);
		
		this.fs = this.createFs("files");
		this.backupFs = this.createFs("backups");
		
		this.snippets = new Snippets(this.createFs("snippets"));
		
		await this.snippets.init();
		
		//if (config.lspUrl) {
		//	this.lsp = lsp(config.lspUrl);
		//}
	}
	
	createFs(key) {
		let fs = fsWeb(this.config.fsPrefix + "-" + key);
		
		return createFs({
			fs,
			path,
			homeDir: this.systemInfo.homeDir,
			minimatch,
						
			async mkdirp(path) {
				let dirs = path.substr(1).split("/").filter(Boolean);
				
				for (let i = 1; i <= dirs.length; i++) {
					let path = "/" + dirs.slice(0, i).join("/");
					
					if (!await fs.exists(path)) {
						await fs.mkdir(path);
					}
				}
			},
			
			fileIsBinary(path) {
				return false;
			},
			
			cwd() {
				return "/";
			},
	
			watch(path, handler) {
				return fs.watch(path, handler);
			},
		});
	}
	
	async save(path, code) {
		let node = this.fs(path);
		
		await node.parent.mkdirp();
		await node.write(code);
	}
	
	saveAs() {
		let name = (prompt("Filename:") || "").trim();
		
		if (!name) {
			return null;
		}
		
		return name[0] === "/" ? name : "/" + name;
	}
	
	backup(document) {
		let key = encodeURIComponent(document.url);
		
		this.backupFs(key).write(document.string);
	}
	
	removeBackup(document) {
		let key = encodeURIComponent(document.url);
		
		this.backupFs(key).delete();
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
	
	showMessageBox(app, config) {
		return app.showMessageBox(config);
	}
	
	showContextMenu(e, app, items, options) {
		contextMenu(app, items, {
			x: e.clientX,
			y: e.clientY,
		}, options);
	}
	
	showContextMenuForElement(app, element, items, options) {
		let {x, y, height} = screenOffsets(element);
		let coords = {x, y: y + height};
		
		contextMenu(app, items, coords, options);
	}
	
	//handleIpcMessages(channel, handler) {
	//	// noop
	//}
	
	get isWindows() {
		return false;
	}
	
	setTitle(title) {
		// noop
	}
	
	loadTreeSitterLanguage(name) {
		return TreeSitter.Language.load(this.config.resourcePrefix + "vendor/tree-sitter/langs/tree-sitter-" + name + ".wasm");
	}
	
	locateTreeSitterWasm() {
		return this.config.resourcePrefix + "vendor/tree-sitter/tree-sitter.wasm";
	}
	
	showWindow() {
		// noop
	}
	
	closeWindow() {
		// noop
	}
}

module.exports = Platform;
