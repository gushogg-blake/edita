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
	
	getRootEntry() {
		return base.DirEntries.createEntry(this.dir);
	}
}
