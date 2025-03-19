let os = require("node:os");
let path = require("node:path");

import bluebird from "bluebird";
import {Language} from "web-tree-sitter";

import Evented from "utils/Evented";
import screenOffsets from "utils/dom/screenOffsets";
import promiseWithMethods from "utils/promiseWithMethods";
import lid from "utils/lid";
import contextMenu from "modules/contextMenu";

import fs from "platforms/electron/modules/fs";
import ipcRenderer from "platforms/electron/modules/ipcRenderer";
import ipc from "platforms/electron/modules/ipc";

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
	
	dialogPromise(_showSyntheticDialog, name, options) {
		let promise = promiseWithMethods();
		
		ipc.openDialogWindow(name, options);
		
		this.dialogPromises[name] = promise;
		
		return promise;
	}
	
	openDialogWindow(_showSyntheticDialog, dialog, dialogOptions, _windowOptions) {
		ipc.openDialogWindow(dialog, dialogOptions);
	}
	
	_showContextMenu(app, items, coords, options) {
		options = {
			noCancel: false,
			useCoordsForNative: false,
			...options,
		};
		
		let custom = options.noCancel || base.getPref("customContextMenu");
		
		if (custom) {
			contextMenu(app, items, coords, options);
		} else {
			items = items.map(function(item) {
				return {
					...item,
					label: item.label?.replaceAll("%", "&"),
				};
			});
			
			ipc.contextMenu(items, options.useCoordsForNative ? coords : undefined);
		}
	}
	
	showContextMenu(e, app, items, options={}) {
		let coords = {
			x: e.clientX,
			y: e.clientY,
		};
		
		this._showContextMenu(app, items, coords, {
			...options,
			useCoordsForNative: false,
		});
	}
	
	showContextMenuForElement(app, element, items, options={}) {
		let {x, y, height} = screenOffsets(element);
		
		x = Math.round(x);
		y = Math.round(y);
		
		let coords = {x, y: y + height};
		
		this._showContextMenu(app, items, coords, options);
	}
	
	callOpener(channel, method, ...args) {
		return ipcRenderer.invoke("callOpener", "call", channel, method, ...args);
	}
	
	get isWindows() {
		return process.platform === "win32";
	}
	
	setTitle(title) {
		document.title = (title ? title + " - " : "") + "Edita";
	}
	
	loadTreeSitterLanguage(name) {
		return Language.load("/vendor/tree-sitter/langs/tree-sitter-" + name + ".wasm");
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

export default Platform;
