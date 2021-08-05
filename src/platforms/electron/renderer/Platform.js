let os = require("os");
let bluebird = require("bluebird");
let fs = require("flowfs");
let {systemInfo} = require("./ipc/init");
let openDialog = require("./ipc/openDialog");
let saveDialog = require("./ipc/saveDialog");
let clipboard = require("./ipc/clipboard");
let contextMenu = require("./ipc/contextMenu");

class Platform {
	constructor() {
		this.systemInfo = systemInfo;
		this.clipboard = clipboard;
	}
	
	async open(defaultPath, currentPath) {
		let path = currentPath ? fs(currentPath).parent.path : defaultPath || os.homedir();
		
		let {
			canceled,
			filePaths,
		} = await openDialog({
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
		let {filePath} = await saveDialog({
			
		});
		
		return filePath || null;
	}
	
	showContextMenu(items) {
		contextMenu(items);
	}
	
	loadTreeSitterLanguage(name) {
		return TreeSitter.Language.load(fs(__dirname, "../../../../vendor/tree-sitter/langs/" + name + ".wasm").path); // TODO portability (path separator)
	}
}

module.exports = Platform;
