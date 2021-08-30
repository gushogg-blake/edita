let {ipcRenderer} = require("electron");
let os = require("os");
let path = require("path");
let fsExtra = require("fs-extra");
let minimatch = require("minimatch");
let glob = require("glob");
let bluebird = require("bluebird");
let get = require("lodash.get");
let set = require("lodash.set");

let Evented = require("utils/Evented");
let defaultPrefs = require("modules/defaultPrefs");

let fs = require("../common/modules/fs");
let init = require("./modules/ipc/init");
let dialog = require("./modules/ipc/dialog");
let clipboard = require("./modules/ipc/clipboard");
let contextMenu = require("./modules/ipc/contextMenu");
let prefs = require("./modules/ipc/prefs");
let snippets = require("./modules/ipc/snippets");
let session = require("./modules/ipc/session");

class Platform extends Evented {
	constructor() {
		super();
		
		let {
			config,
			systemInfo,
			isMainWindow,
		} = init;
		
		this.config = config;
		this.systemInfo = systemInfo;
		this.isMainWindow = isMainWindow;
		
		this.clipboard = clipboard;
		this.path = path;
		
		this.fs = fs({
			fs: fsExtra,
			path,
			minimatch,
			glob,
			
			cwd() {
				return process.cwd();
			},
		});
		
		prefs.on("update", this.onPrefsUpdate.bind(this));
		snippets.on("new", this.onNewSnippet.bind(this));
		snippets.on("update", this.onSnippetUpdate.bind(this));
		
		ipcRenderer.on("closeWindow", () => {
			let defaultPrevented = false;
			
			this.fire("closeWindow", {
				preventDefault() {
					defaultPrevented = true;
				},
			});
			
			if (!defaultPrevented) {
				this.fire("windowClosing");
				
				ipcRenderer.send("closeWindow");
			}
		});
	}
	
	async init() {
		this.prefs = await prefs.load() || defaultPrefs(this.systemInfo);
		this.snippets = await snippets.load();
	}
	
	async open(dir=null) {
		let defaultPath = dir || os.homedir();
		
		let {
			canceled,
			filePaths,
		} = await dialog.showOpen({
			defaultPath,
			
			properties: [
				"openFile",
				"multiSelections",
			],
		});
		
		if (canceled) {
			return [];
		}
		
		return filePaths;
	}
	
	async save(path, code) {
		await this.fs(path).write(code);
	}
	
	async saveAs() {
		let {filePath} = await dialog.showSave({
			
		});
		
		return filePath || null;
	}
	
	showMessageBox(options) {
		return dialog.showMessageBox({
			normalizeAccessKeys: true,
			...options,
		});
	}
	
	showContextMenu(e, items) {
		contextMenu(items);
	}
	
	openWindow(url, options, callback) {
		let {
			title = "Editor",
			width = 800,
			height = 600,
			top = null,
			left = null,
		} = options;
		
		if (top === null) {
			top = Math.round(window.screenTop + (window.outerHeight - height) / 2);
		}
		
		if (left === null) {
			left = Math.round(window.screenLeft + (window.outerWidth - width) / 2);
		}
		
		let win = window.open(url, "", "width=" + width + ",height=" + height + ",top=" + top + ",left=" + left);
		
		win.addEventListener("load", function() {
			win.document.title = title;
			
			callback({
				el: win.document.body,
				
				closeWindow() {
					win.close();
				},
			});
		});
	}
	
	loadTreeSitterLanguage(name) {
		return TreeSitter.Language.load(path.join(__dirname, "public", "vendor", "tree-sitter", "langs", name + ".wasm"));
	}
	
	getPref(key) {
		return get(this.prefs, key);
	}
	
	setPref(key, value) {
		set(this.prefs, key, value);
		
		prefs.save(this.prefs);
	}
	
	onPrefsUpdate() {
		this.fire("prefsUpdated");
	}
	
	onNewSnippet() {
		
	}
	
	onSnippetUpdate() {
		
	}
	
	editSnippet(snippet) {
		
	}
	
	getSnippet(name) {
		return this.snippets.find(s => s.name === name);
	}
	
	loadSession() {
		return session.load();
	}
	
	saveSession(data) {
		return session.save(data);
	}
}

module.exports = Platform;
