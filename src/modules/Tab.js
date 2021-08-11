let bluebird = require("bluebird");
let Evented = require("../utils/Evented");

function fs(...args) {
	return platform.fs(...args);
}


class Tab extends Evented {
	constructor(app, editor) {
		super();
		
		this.app = app;
		this.editor = editor;
		this.originalPath = this.editor.document.path;
		this.currentPath = this.originalPath;
		this.files = [];
	}
	
	zoomOut() {
		if (!this.currentPath) {
			return;
		}
		
		this.currentPath = fs(this.currentPath).parent.path;
		
		this.fire("zoomChange");
		
		this.updateDirListing();
	}
	
	zoomIn() {
		if (!this.currentPath) {
			return;
		}
		
		let original = fs(this.originalPath);
		let current = fs(this.currentPath);
		
		if (!original.isDescendantOf(current)) {
			return;
		}
		
		let pathToOriginal = original.pathFrom(current).split(platform.path.sep);
		
		if (pathToOriginal[0] === "..") {
			return;
		}
		
		if (pathToOriginal.length === 1) {
			this.currentPath = this.originalPath;
		} else {
			this.currentPath = current.child(pathToOriginal[0]).path;
		}
		
		this.fire("zoomChange");
		
		this.updateDirListing();
	}
	
	switchToFile(file) {
		if (file.isDir) {
			this.currentPath = file.path;
			
			this.updateDirListing();
		} else {
			this.app.openFile(file.path);
		
			this.currentPath = this.originalPath;
		}
		
		this.fire("zoomChange");
	}
	
	openFile(file) {
	}
	
	async updateDirListing() {
		if (this.currentPath === this.originalPath) {
			this.files = [];
		} else {
			this.files = await bluebird.map(platform.fs(this.currentPath).ls(), async function(node) {
				let isDir = await node.isDir();
				
				let {
					path,
					name,
				} = node;
				
				return {
					isDir: await node.isDir(),
					path,
					name,
				};
			});
		}
		
		this.fire("updateDirListing");
	}
}

module.exports = Tab;
