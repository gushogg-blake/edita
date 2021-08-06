let os = require("os");
let bluebird = require("bluebird");
let fs = require("flowfs");
let {systemInfo} = require("./ipc/init");
let dialog = require("./ipc/dialog");
let clipboard = require("./ipc/clipboard");
let contextMenu = require("./ipc/contextMenu");

class Platform {
	constructor() {
		this.systemInfo = systemInfo;
		this.clipboard = clipboard;
		this.fs = fs;
	}
	
	async open(defaultPath, currentPath) {
		let path = currentPath ? fs(currentPath).parent.path : defaultPath || os.homedir();
		
		let {
			canceled,
			filePaths,
		} = await dialog.showOpen({
			defaultPath: path,
			
			properties: [
				"openFile",
				"multiSelections",
			],
		});
		
		if (canceled) {
			return [];
		}
		
		return bluebird.map(filePaths, async function(path) {
			return {
				path,
				code: await fs(path).read(),
			};
		});
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
		return dialog.showMessageBox(options);
	}
	
	showContextMenu(items) {
		contextMenu(items);
	}
	
	loadTreeSitterLanguage(name) {
		return TreeSitter.Language.load(fs(__dirname, "../../../../vendor/tree-sitter/langs/" + name + ".wasm").path); // TODO portability (path separator)
	}
}

module.exports = Platform;
