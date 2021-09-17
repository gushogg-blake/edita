let os = require("os");
let path = require("path");
let glob = require("glob");
let bluebird = require("bluebird");
let get = require("lodash.get");
let set = require("lodash.set");

let Evented = require("utils/Evented");
let screenOffsets = require("utils/dom/screenOffsets");
let defaultPrefs = require("modules/defaultPrefs");

let fs = require("platform/modules/fs");
let ipcRenderer = require("platform/modules/ipcRenderer");
let ipc = require("platform/modules/ipc");

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
				this.closeWindow();
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
	
	async saveAs(options) {
		let {filePath} = await ipc.dialog.showSave(options);
		
		return filePath || null;
	}
	
	findInFiles(paths) {
		this.openDialogWindow("/dialogs/findAndReplace.html", {
			replace: false,
			searchIn: "files",
			paths,
		}, {
			width: 640,
			height: 300,
		});
	}
	
	findAndReplaceInFiles(paths) {
		this.openDialogWindow("/dialogs/findAndReplace.html", {
			replace: true,
			searchIn: "files",
			paths,
		}, {
			width: 640,
			height: 300,
		});
	}
	
	editSnippet(snippet) {
		this.openDialogWindow("/dialogs/snippetEditor.html", null, {
			width: 680,
			height: 480,
		});
	}
	
	filesFromDropEvent(e) {
		return [...e.dataTransfer.files].map(function(file) {
			return {
				path: file.path,
				code: null,
			};
		});
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
	
	showContextMenuForElement(element, items) {
		let {x, y, height} = screenOffsets(element);
		
		ipc.contextMenu(items, {x, y: y + height});
	}
	
	openDialogWindow(url, dialogOptions, windowOptions) {
		ipc.openDialogWindow(url + "?options=" + encodeURIComponent(JSON.stringify(dialogOptions)), windowOptions);
	}
	
	callParentWindow(channel, method, ...args) {
		return ipcRenderer.invoke("callParentWindow", "call", channel, method, ...args);
	}
	
	handleIpcMessages(channel, handler) {
		ipcRenderer.handle(channel, function(e, method, ...args) {
			return handler[method](...args);
		});
	}
	
	setTitle(title) {
		document.title = (title ? title + " - " : "") + "Editor";
	}
	
	loadTreeSitterLanguage(name) {
		return TreeSitter.Language.load(path.join(__dirname, "public", "vendor", "tree-sitter", "langs", "tree-sitter-" + name + ".wasm"));
	}
	
	getPref(key) {
		return get(this.prefs, key);
	}
	
	setPref(key, value) {
		set(this.prefs, key, value);
		
		ipc.prefs.save(this.prefs);
	}
	
	resetPrefs() {
		this.prefs = defaultPrefs(this.systemInfo);
		
		ipc.prefs.save(this.prefs);
	}
	
	onPrefsUpdate() {
		this.fire("prefsUpdated");
	}
	
	onNewSnippet() {
		
	}
	
	onSnippetUpdate() {
		
	}
	
	getSnippet(name) {
		return this.snippets.find(s => s.name === name);
	}
	
	loadJson(key) {
		return ipc.jsonStore.load(key);
	}
	
	saveJson(key, data) {
		return ipc.jsonStore.save(key, data);
	}
	
	closeWindow() {
		ipcRenderer.send("closeWindow");
	}
}

module.exports = Platform;
