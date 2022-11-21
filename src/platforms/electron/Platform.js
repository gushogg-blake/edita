let os = require("os");
let path = require("path");
let bluebird = require("bluebird");

let screenOffsets = require("utils/dom/screenOffsets");
let promiseWithMethods = require("utils/promiseWithMethods");
let contextMenu = require("modules/contextMenu");

let Common = require("platforms/common/Platform");

let fs = require("platform/modules/fs");
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
		this.jsonStore = ipc.jsonStore;
		this.lsp = ipc.lsp;
		this.path = path;
		this.fs = fs;
		
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
				
				delete this.messageBoxPromise;
			}
		});
		
		ipcRenderer.on("dialogClosed", () => {
			this.fire("dialogClosed");
		});
	}
	
	async init() {
		await this.snippets.init();
	}
	
	async _open(dir, type) {
		let defaultPath = dir || os.homedir();
		
		let {
			canceled,
			filePaths,
		} = await ipc.dialog.showOpen({
			defaultPath,
			
			properties: [
				type,
				"multiSelections",
			],
		});
		
		if (canceled) {
			return [];
		}
		
		return filePaths;
	}
	
	open(dir=null) {
		return this._open(dir, "openFile");
	}
	
	chooseDir(startDir=null) {
		return this._open(startDir, "openDirectory");
	}
	
	async saveAs(options) {
		let {filePath} = await ipc.dialog.showSave(options);
		
		return filePath || null;
	}
	
	backup(document) {
		let key = encodeURIComponent(document.url);
		
		this.fs(this.config.userDataDir, "backups", key).write(document.string, {
			mkdirp: true,
		});
	}
	
	removeBackup(document) {
		let key = encodeURIComponent(document.url);
		
		this.fs(this.config.userDataDir, "backups", key).deleteIfExists();
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
	
	showMessageBox(app, options) {
		let promise = promiseWithMethods();
		
		ipc.openDialogWindow("messageBox", options);
		
		this.messageBoxPromise = promise;
		
		return promise;
	}
	
	showContextMenu(e, app, items, options={}) {
		options = {
			noCancel: false,
			...options,
		};
		
		items = items.map(function(item) {
			return {
				...item,
				label: item.label.replaceAll("%", "&"),
			};
		});
		
		if (options.noCancel) {
			contextMenu(app, items, {
				x: e.clientX,
				y: e.clientY,
			}, options);
		} else {
			ipc.contextMenu(items);
		}
	}
	
	showContextMenuForElement(app, element, items, options={}) {
		options = {
			noCancel: false,
			...options,
		};
		
		let {x, y, height} = screenOffsets(element);
		
		x = Math.round(x);
		y = Math.round(y);
		
		let coords = {x, y: y + height};
		
		if (options.noCancel) {
			contextMenu(app, items, coords, options);
		} else {
			ipc.contextMenu(items, coords);
		}
	}
	
	openDialogWindow(app, dialog, dialogOptions, windowOptions) {
		ipc.openDialogWindow(dialog, dialogOptions);
	}
	
	callOpener(channel, method, ...args) {
		return ipcRenderer.invoke("callOpener", "call", channel, method, ...args);
	}
	
	//handleIpcMessages(channel, handler) {
	//	return ipcRenderer.handle(channel, function(e, method, ...args) {
	//		return handler[method](...args);
	//	});
	//}
	
	get isWindows() {
		return process.platform === "win32";
	}
	
	setTitle(title) {
		document.title = (title ? title + " - " : "") + "Treefrog";
	}
	
	loadTreeSitterLanguage(name) {
		return TreeSitter.Language.load("/vendor/tree-sitter/langs/tree-sitter-" + name + ".wasm");
	}
	
	closeWindow() {
		ipcRenderer.send("closeWindow");
	}
}

module.exports = Platform;
