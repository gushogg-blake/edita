let os = require("node:os");
let path = require("node:path");
let {webUtils} = require("electron");

import bluebird from "bluebird";
import {Language} from "web-tree-sitter";

import {lid, promiseWithMethods} from "utils";
import type {PromiseWithMethods} from "utils";
import {screenOffsets} from "utils/dom";
import {URL, File} from "core";

import type {ContextMenuOptions} from "ui/contextMenu";
import type {App} from "ui/app";

import fs from "platforms/electron/modules/fs";
import ipcRenderer from "platforms/electron/modules/ipcRenderer";
import ipc from "platforms/electron/modules/ipc";
import clipboard from "platforms/electron/modules/clipboard";

import PlatformCommon from "platforms/common/Platform";

type ElectronContextMenuOptions = ContextMenuOptions & {
	useCoordsForNative?: boolean;
};

export default class Platform extends PlatformCommon {
	private dialogPromises: Record<string, PromiseWithMethods<any>> = {};
	
	constructor() {
		super();
		
		this.isWeb = false;
		
		let {
			config,
			isMainWindow,
		} = ipc.init;
		
		this.config = config;
		this.isMainWindow = isMainWindow;
		
		this.systemInfo = {
			newline: os.EOL,
			homeDir: os.homedir(),
			pathSeparator: path.sep,
			multiPathSeparator: process.platform === "win32" ? ";" : ":",
		};
		
		this.clipboard = clipboard;
		this.jsonStore = ipc.jsonStore;
		this.lsp = ipc.lsp;
		this.path = path;
		this.fs = fs;
		
		this.urlsToOpenOnStartup = config.files.map(function(path) {
			return URL.file(path);
		});
		
		ipcRenderer.on("closeWindow", () => {
			let e = this.fire("closeWindow");
			
			if (!e.defaultPrevented) {
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
	
	filesFromDropEvent(e, app) {
		return app.readFiles([...e.dataTransfer.files].map((file) => {
			return URL.file(webUtils.getPathForFile(file));
		}));
	}
	
	dialogPromise(_showSyntheticDialog, name, options, _windowOptions): PromiseWithMethods<any> {
		let promise = promiseWithMethods();
		
		ipc.openDialogWindow(name, options);
		
		this.dialogPromises[name] = promise;
		
		return promise;
	}
	
	openDialogWindow(_showSyntheticDialog, name: string, options, _windowOptions): void {
		ipc.openDialogWindow(name, options);
	}
	
	private _showContextMenu(app, items, coords, options: ElectronContextMenuOptions = {}): void {
		options = {
			noCancel: false,
			useCoordsForNative: false,
			...options,
		};
		
		let custom = options.noCancel || base.getPref("customContextMenu");
		
		if (custom) {
			app.showContextMenu(items, coords, options as ContextMenuOptions);
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
	
	showContextMenu(e, app: App, items, options: ElectronContextMenuOptions = {}): void {
		let coords = {
			x: e.clientX,
			y: e.clientY,
		};
		
		this._showContextMenu(app, items, coords, {
			...options,
			useCoordsForNative: false,
		});
	}
	
	showContextMenuForElement(app: App, element: HTMLElement, items, options={}): void {
		let {x, y, height} = screenOffsets(element);
		
		x = Math.round(x);
		y = Math.round(y);
		
		let coords = {x, y: y + height};
		
		this._showContextMenu(app, items, coords, {
			...options,
			useCoordsForNative: true,
		});
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
