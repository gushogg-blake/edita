let os = require("os");
let path = require("path");
let bluebird = require("bluebird");

let Evented = require("utils/Evented");
let screenOffsets = require("utils/dom/screenOffsets");
let promiseWithMethods = require("utils/promiseWithMethods");
let lid = require("utils/lid");
let contextMenu = require("modules/contextMenu");

let fs = require("platform/modules/fs");
let ipcRenderer = require("platform/modules/ipcRenderer");
let ipc = require("platform/modules/ipc");

class Platform extends Evented {
	constructor(options={}) {
		super();
		
		options = {
			isDialogWindow: false,
			...options,
		};
		
		this.isWeb = false;
		
		let {
			config,
			isMainWindow,
		} = ipc.init;
		
		this.config = config;
		this.isMainWindow = isMainWindow;
		this.isDialogWindow = options.isDialogWindow;
		
		this.systemInfo = {
			newline: os.EOL,
			homeDir: os.homedir(),
			pathSeparator: path.sep,
			multiPathSeparator: process.platform === "win32" ? ";" : ":",
		};
		
		this.clipboard = ipc.clipboard;
		this.snippets = ipc.snippets;
		this.jsonStore = ipc.jsonStore;
		this.lsp = ipc.lsp;
		this.path = path;
		this.fs = fs;
		
		this.filesToOpenOnStartup = config.files.map(p => fs(config.cwd, p).path);
		
		this.dialogPromises = {};
		
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
		
		ipcRenderer.handle("dialogResponse", (e, {name, response}) => {
			let promise = this.dialogPromises[name];
			
			console.log(name, response);
			
			promise?.resolve(response);
			
			delete this.dialogPromises[name];
		});
		
		// the main process sends this to dialog windows to let them
		// know they've been closed, so they can send e.g. a null response
		// to the opener. (if the opener is still open, dialog windows are
		// kept around for performance reasons, so they don't get e.g.
		// window.onbeforeunload)
		
		ipcRenderer.on("dialogClosed", () => {
			this.fire("dialogClosed");
		});
	}
	
	async init() {
		await this.snippets.init();
	}
	
	async _open(dir, mode) {
		let path = dir || os.homedir();
		
		let {canceled, paths} = await this._dialogPromise("fileChooser", {
			path,
			mode,
		});
		
		if (canceled) {
			return [];
		}
		
		return paths;
	}
	
	open(dir=null) {
		return this._open(dir, "selectFiles");
	}
	
	chooseDir(startDir=null) {
		return this._open(startDir, "selectDir");
	}
	
	async saveAs(options) {
		let {canceled, path} = await this._dialogPromise("fileChooser", {
			mode: "save",
			...options,
		});
		
		return path || null;
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
	
	_dialogPromise(name, options) {
		let promise = promiseWithMethods();
		
		ipc.openDialogWindow(name, options);
		
		this.dialogPromises[name] = promise;
		
		return promise;
	}
	
	showMessageBox(_app, options) {
		return this._dialogPromise("messageBox", options);
	}
	
	showContextMenu(e, app, items, options={}) {
		options = {
			noCancel: false,
			...options,
		};
		
		items = items.map(function(item) {
			return {
				...item,
				label: item.label?.replaceAll("%", "&"),
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
		document.title = (title ? title + " - " : "") + "Edita";
	}
	
	loadTreeSitterLanguage(name) {
		return TreeSitter.Language.load("/vendor/tree-sitter/langs/tree-sitter-" + name + ".wasm");
	}
	
	locateTreeSitterWasm() {
		return "/vendor/tree-sitter/tree-sitter.wasm";
	}
	
	showWindow() {
		ipcRenderer.send("showWindow");
	}
	
	closeWindow() {
		ipcRenderer.send("closeWindow");
	}
}

module.exports = Platform;
