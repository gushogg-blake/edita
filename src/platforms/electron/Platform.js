let os = require("os");
let path = require("path");
let bluebird = require("bluebird");
let get = require("lodash.get");
let set = require("lodash.set");

let Evented = require("utils/Evented");
let screenOffsets = require("utils/dom/screenOffsets");
let defaultPrefs = require("modules/defaultPrefs");

let fs = require("platform/modules/fs");
let walk = require("platform/modules/walk");
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
		this.snippets = ipc.snippets;
		this.path = path;
		this.walk = walk;
		this.fs = fs;
		
		ipc.prefs.on("update", this.onPrefsUpdate.bind(this));
		
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
		
		await this.snippets.init();
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
	
	openDialogWindow(app, dialog, dialogOptions, windowOptions) {
		ipc.openDialogWindow(dialog, dialogOptions, windowOptions);
	}
	
	callOpener(channel, method, ...args) {
		return ipcRenderer.invoke("callOpener", "call", channel, method, ...args);
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
