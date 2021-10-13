let os = require("os");
let path = require("path");
let bluebird = require("bluebird");
let get = require("lodash.get");
let set = require("lodash.set");

let screenOffsets = require("utils/dom/screenOffsets");
let promiseWithMethods = require("utils/promiseWithMethods");
let defaultPrefs = require("modules/defaultPrefs");
let contextMenu = require("modules/contextMenu");

let Common = require("platforms/common/Platform");

let fs = require("platform/modules/fs");
let walk = require("platform/modules/walk");
let ipcRenderer = require("platform/modules/ipcRenderer");
let ipc = require("platform/modules/ipc");

class Platform extends Common {
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
		
		this.useFileUploader = false;
		
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
		
		ipcRenderer.handle("messageBoxResponse", (e, response) => {
			if (this.messageBoxPromise) {
				this.messageBoxPromise.resolve(response);
				
				this.messageBoxPromise = null;
			}
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
	
	backup(path, code) {
		let name = (path || "(new file)").replaceAll("/", "_") + "-" + new Date();
		
		this.fs(this.config.userDataDir, "backups", name).write(code, {
			mkdirp: true,
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
		let promise = promiseWithMethods();
		
		ipc.openDialogWindow("messageBox", options, {
			useOpenerAsParent: true,
			modal: true,
			width: 500,
			height: 200,
		});
		
		this.messageBoxPromise = promise;
		
		return promise;
	}
	
	showContextMenu(e, items, noCancel=false) {
		items = items.map(function(item) {
			return {
				...item,
				label: item.label.replaceAll("%", "&"),
			};
		});
		
		if (noCancel) {
			contextMenu(items, {
				x: e.clientX,
				y: e.clientY,
			}, true);
		} else {
			ipc.contextMenu(items);
		}
	}
	
	showContextMenuForElement(element, items, noCancel=false) {
		let {x, y, height} = screenOffsets(element);
		let coords = {x, y: y + height};
		
		if (noCancel) {
			contextMenu(items, coords, true);
		} else {
			ipc.contextMenu(items, coords);
		}
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
