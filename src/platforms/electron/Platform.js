let {ipcRenderer} = require("electron");
let os = require("os");
let path = require("path");
let glob = require("glob");
let bluebird = require("bluebird");
let get = require("lodash.get");
let set = require("lodash.set");

let Evented = require("utils/Evented");
let defaultPrefs = require("modules/defaultPrefs");

let fs = require("./modules/fs");
let ipc = require("./modules/ipc");

class Platform extends Evented {
	constructor() {
		super();
		
		let {
			config,
			systemInfo,
			isMainWindow,
			filesToOpenOnStartup,
		} = ipc.init;
		
		this.config = config;
		this.systemInfo = systemInfo;
		this.isMainWindow = isMainWindow;
		this.filesToOpenOnStartup = filesToOpenOnStartup;
		
		this.clipboard = ipc.clipboard;
		this.path = path;
		this.fs = fs;
		
		ipc.prefs.on("update", this.onPrefsUpdate.bind(this));
		ipc.snippets.on("new", this.onNewSnippet.bind(this));
		ipc.snippets.on("update", this.onSnippetUpdate.bind(this));
		
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
		
		ipcRenderer.on("open", (e, files) => {
			this.fire("openFromElectronSecondInstance", files);
		});
	}
	
	async init() {
		this.prefs = await ipc.prefs.load() || defaultPrefs(this.systemInfo);
		this.snippets = await ipc.snippets.load();
	}
	
	async open(dir=null) {
		let defaultPath = dir || os.homedir();
		
		let {
			canceled,
			filePaths,
		} = await ipc.dialog.showOpen({
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
		await fs(path).write(code);
	}
	
	async saveAs() {
		let {filePath} = await ipc.dialog.showSave({
			
		});
		
		return filePath || null;
	}
	
	getFilesToOpenOnStartup() {
		return this.filesToOpenOnStartup;
	}
	
	showMessageBox(options) {
		return ipc.dialog.showMessageBox({
			normalizeAccessKeys: true,
			...options,
		});
	}
	
	showContextMenu(e, items) {
		ipc.contextMenu(items);
	}
	
	openWindow(url, options) {
		let {
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
	}
	
	setTitle(title) {
		document.title = (title ? title + " - " : "") + "Editor";
	}
	
	loadTreeSitterLanguage(name) {
		return TreeSitter.Language.load(path.join(__dirname, "public", "vendor", "tree-sitter", "langs", name + ".wasm"));
	}
	
	getPref(key) {
		return get(this.prefs, key);
	}
	
	setPref(key, value) {
		set(this.prefs, key, value);
		
		ipc.prefs.save(this.prefs);
	}
	
	onPrefsUpdate() {
		this.fire("prefsUpdated");
	}
	
	onNewSnippet() {
		
	}
	
	onSnippetUpdate() {
		
	}
	
	editSnippet(snippet) {
		this.openWindow("editSnippet.html", {
			width: 680,
			height: 480,
		});
	}
	
	getSnippet(name) {
		return this.snippets.find(s => s.name === name);
	}
	
	loadSession() {
		return ipc.session.load();
	}
	
	saveSession(session) {
		return ipc.session.save(session);
	}
}

module.exports = Platform;
