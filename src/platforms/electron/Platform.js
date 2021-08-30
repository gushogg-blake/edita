let {ipcRenderer} = require("electron");
let os = require("os");
let path = require("path");
let fsExtra = require("fs-extra");
let minimatch = require("minimatch");
let glob = require("glob");
let bluebird = require("bluebird");
let Evented = require("utils/Evented");
let fs = require("../common/modules/fs");
let init = require("./modules/ipc/init");
let dialog = require("./modules/ipc/dialog");
let clipboard = require("./modules/ipc/clipboard");
let contextMenu = require("./modules/ipc/contextMenu");

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
		
		this.dataDirNode = this.fs(config.userDataDir);
		this.snippetsDir = path.join(config.userDataDir, "snippets");
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
	
	openWindow(options, callback) {
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
		
		let win = window.open("blank.html", "", "width=" + width + ",height=" + height + ",top=" + top + ",left=" + left);
		
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
	
	async loadSnippets() {
		let dir = this.fs(this.snippetsDir);
		
		if (!await dir.exists()) {
			return [];
		}
		
		return bluebird.map(dir.glob("*.json"), node => node.readJson());
	}
	
	async loadJson(key) {
		try {
			return await this.dataDirNode.child(key + ".json").readJson();
		} catch (e) {
			return null;
		}
	}
	
	saveJson(key, data) {
		return this.dataDirNode.child(key + ".json").writeJson(data);
	}
}

module.exports = Platform;
