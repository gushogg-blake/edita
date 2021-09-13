let bluebird = require("bluebird");
let Evented = require("utils/Evented");

module.exports = class extends Evented {
	constructor(app) {
		super();
		
		this.app = app;
		this.dir = platform.systemInfo.homeDir;
		
		this.init();
	}
	
	async init() {
		let dir = await platform.loadJson("fileTree.rootDir");
		
		if (dir) {
			this.setRootDir(dir);
		}
	}
	
	setRootDir(dir) {
		this.dir = dir;
		
		platform.saveJson("fileTree.rootDir", dir);
		
		this.fire("updateRootDir");
	}
	
	getRootEntry() {
		return base.DirEntries.createEntry(this.dir);
	}
}
