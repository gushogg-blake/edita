let Evented = require("../utils/Evented");

function fs(...args) {
	return platform.fs(...args);
}


class Tab extends Evented {
	constructor(editor) {
		super();
		
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
		
		let pathToOriginal = original.pathFrom(current);
		
		console.log(current.pathFrom(current));
		
		console.log(pathToOriginal);
		
		this.currentPath = fs(this.currentPath).parent.path;
		
		this.fire("zoomChange");
		
		this.updateDirListing();
	}
	
	async updateDirListing() {
		if (this.currentPath === this.originalPath) {
			this.files = [];
		} else {
			this.files = await platform.fs(this.currentPath).readdir();
			console.log(this.files);
		}
		
		this.fire("updateDirListing");
	}
}

module.exports = Tab;
