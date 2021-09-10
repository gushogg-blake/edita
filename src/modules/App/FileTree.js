let bluebird = require("bluebird");
let Evented = require("utils/Evented");

module.exports = class extends Evented {
	constructor(app) {
		super();
		
		this.app = app;
		this.dir = platform.systemInfo.homeDir; // TODO save
	}
	
	setRootDir(dir) {
		this.dir = dir;
		
		this.fire("updateRootDir");
	}
	
	showContextMenuForEntry(e, entry) {
		let {path, isDir} = entry;
		
		platform.showContextMenu(e, [
			isDir && {
				label: "Make this folder root",
				
				onClick: () => {
					this.setRootDir(path);
				},
			},
		].filter(Boolean));
	}
	
	async createEntry(path) {
		let node = platform.fs(path);
		
		return {
			path,
			node,
			isDir: await node.isDir(),
		};
	}
	
	ls(entry) {
		return bluebird.map(entry.node.ls(), node => this.createEntry(node.path))
	}
	
	getRootEntry() {
		return this.createEntry(this.dir);
	}
}
