let bluebird = require("bluebird");
let Evented = require("utils/Evented");

function fs(...args) {
	return platform.fs(...args);
}

class Tab extends Evented {
	constructor(app, editor) {
		super();
		
		this.app = app;
		this.editor = editor;
		this.path = this.editor.document.path;
		this.currentPath = this.path;
		this.files = [];
		this.loading = false;
		
		this.pendingActions = [];
	}
	
	async zoomOut() {
		if (this.loading) {
			this.pendingActions.push(this.zoomOut.bind(this));
			
			return;
		}
		
		if (!this.currentPath) {
			return;
		}
		
		if (
			base.prefs.zoom.stopAtProjectRoot
			&& this.currentPath !== this.path
			&& await this.editor.document.mainLang.codeIntel?.isProjectRoot(this.currentPath)
		) {
			return;
		}
		
		this.loading = true;
		
		this.currentPath = fs(this.currentPath).parent.path;
		
		this.fire("zoomChange");
		
		await this.updateDirListing();
		
		this.loading = false;
		
		if (this.pendingActions.length > 0) {
			this.pendingActions.pop()();
		}
	}
	
	async zoomIn() {
		if (this.loading) {
			this.pendingActions.push(this.zoomIn.bind(this));
			
			return;
		}
		
		if (!this.currentPath) {
			return;
		}
		
		let original = fs(this.path);
		let current = fs(this.currentPath);
		
		if (!original.isDescendantOf(current)) {
			return;
		}
		
		let pathToOriginal = original.pathFrom(current).split(platform.path.sep);
		
		if (pathToOriginal[0] === "..") {
			return;
		}
		
		this.loading = true;
		
		if (pathToOriginal.length === 1) {
			this.currentPath = this.path;
		} else {
			this.currentPath = current.child(pathToOriginal[0]).path;
		}
		
		this.fire("zoomChange");
		
		await this.updateDirListing();
		
		this.loading = false;
		
		if (this.pendingActions.length > 0) {
			this.pendingActions.pop()();
		}
	}
	
	switchToFile(file) {
		if (file.isDir) {
			this.currentPath = file.path;
			
			this.updateDirListing();
		} else {
			this.app.openFile(file.path);
		
			this.currentPath = this.path;
		}
		
		this.fire("zoomChange");
	}
	
	openFile(file) {
	}
	
	async updateDirListing() {
		if (this.currentPath === this.path) {
			this.files = [];
		} else {
			this.files = await bluebird.map(platform.fs(this.currentPath).ls(), async function(node) {
				let isDir = await node.isDir();
				
				let {
					path,
					name,
				} = node;
				
				return {
					isDir,
					isFile: !isDir,
					path,
					name,
				};
			});
		}
		
		this.fire("updateDirListing");
	}
	
	showContextMenuForTabButton(e) {
		let items = [];
		
		if (this.editor.document.path) {
			items.push({
				id: "rename",
				label: "&Rename",
				
				onClick: () => {
					app.renameTab(this);
				},
			});
		}
		
		platform.showContextMenu(e, items);
	}
	
	teardown() {
		this.editor.teardown();
	}
}

module.exports = Tab;
