let bluebird = require("bluebird");
let fs = require("flowfs");
let {systemInfo} = require("./ipc/init");
let openDialog = require("./ipc/openDialog");

class Platform {
	constructor() {
		this.systemInfo = systemInfo;
	}
	
	async open() {
		let {
			canceled,
			filePaths,
		} = await openDialog({
			defaultPath: "/home/gus/projects/editor",
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
	
	loadTreeSitterLanguage(name) {
		return TreeSitter.Language.load(fs(__dirname, "../../../../vendor/tree-sitter/langs/" + name + ".wasm").path); // TODO portability (path separator)
	}
}

module.exports = Platform;
