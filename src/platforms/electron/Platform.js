let {ipcRenderer} = require("electron");
let os = require("os");
let path = require("path");
let fsExtra = require("fs-extra");
let minimatch = require("minimatch");
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
	
	loadTreeSitterLanguage(name) {
		return TreeSitter.Language.load(path.join(__dirname, "public", "vendor", "tree-sitter", "langs", name + ".wasm"));
	}
	
	async loadSnippets() {
		let dir = this.fs(this.snippetsDir);
		
		if (!await dir.exists()) {
			return [];
		}
		
		return bluebird.map(dir.ls(), node => node.readJson());
	}
	
	loadJson(key) {
		return this.dataDirNode.child(key + ".json").readJson();
	}
	
	saveJson(key, data) {
		return this.dataDirNode.child(key + ".json").writeJson(data);
	}
}

module.exports = Platform;
