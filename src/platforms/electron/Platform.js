let {ipcRenderer} = require("electron");
let os = require("os");
let path = require("path");
let fsExtra = require("fs-extra");
let minimatch = require("minimatch");
let bluebird = require("bluebird");
let Evented = require("utils/Evented");
let fs = require("../common/modules/fs");
let {config, systemInfo} = require("./modules/ipc/init");
let dialog = require("./modules/ipc/dialog");
let clipboard = require("./modules/ipc/clipboard");
let contextMenu = require("./modules/ipc/contextMenu");

class Platform extends Evented {
	constructor() {
		super();
		
		this.config = config;
		this.systemInfo = systemInfo;
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
				ipcRenderer.send("closeWindow");
			}
		});
		
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
	
	showContextMenu(items) {
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
}

module.exports = Platform;
