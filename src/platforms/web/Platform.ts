import minimatch from "minimatch-browser";
import bluebird from "bluebird";
import {Language} from "web-tree-sitter";

import path from "vendor/path-browser";
import fsWeb from "vendor/fs-web";

import {fs as createFs, Evented, lid, promiseWithMethods, type PromiseWithMethods} from "utils";
import {screenOffsets} from "utils/dom";

import {URL, File} from "core";

import type {ContextMenuOptions} from "ui/contextMenu";
import type App from "ui/App";

import clipboard from "platforms/web/modules/clipboard";
import jsonStore from "platforms/web/modules/jsonStore";

import PlatformCommon from "platforms/common/Platform";

export default class Platform extends PlatformCommon {
	private backupFs: any;
	
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
			...config,
		};
		
		this.config = config;
		
		this.jsonStore = jsonStore(config.localStoragePrefix);
		
		this.fs = this.createFs("files");
		this.backupFs = this.createFs("backups");
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
	
	async filesFromDropEvent(e, app) {
		return bluebird.map([...e.dataTransfer.files], async (droppedFile) => {
			let tmpPath = platform.path.resolve("/tmp", "upload-" + lid(), droppedFile.name);
			
			return await File.write(
				URL.file(tmpPath),
				await droppedFile.text(),
			);
		});
	}
	
	dialogPromise(showSyntheticDialog, name: string, options, windowOptions): PromiseWithMethods<any> {
		return showSyntheticDialog(name, options, windowOptions);
	}
	
	openDialogWindow(showSyntheticDialog, name: string, options, windowOptions): void {
		showSyntheticDialog(name, options, windowOptions);
	}
	
	showContextMenu(e, app, items, options: ContextMenuOptions = {}) {
		app.showContextMenu(items, {
			x: e.clientX,
			y: e.clientY,
		}, options);
	}
	
	showContextMenuForElement(app, element, items, options: ContextMenuOptions = {}) {
		let {x, y, height} = screenOffsets(element);
		let coords = {x, y: y + height};
		
		app.showContextMenu(items, coords, options);
	}
	
	get isWindows() {
		return false;
	}
	
	setTitle(title) {
		// noop
	}
	
	loadTreeSitterLanguage(name) {
		return Language.load(this.config.resourcePrefix + "vendor/tree-sitter/langs/tree-sitter-" + name + ".wasm");
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
