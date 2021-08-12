let os = require("os");
let path = require("path");
let bluebird = require("bluebird");
let fs = require("./modules/fs");
let {systemInfo} = require("./ipc/init");
let dialog = require("./ipc/dialog");
let clipboard = require("./ipc/clipboard");
let contextMenu = require("./ipc/contextMenu");

class Platform {
	constructor() {
		this.systemInfo = systemInfo;
		this.clipboard = clipboard;
		this.fs = fs;
		this.path = path;
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
		await fs(path).write(code);
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
}

module.exports = Platform;
