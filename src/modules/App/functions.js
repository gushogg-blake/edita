let bluebird = require("bluebird");

module.exports = {
	async open() {
		let dir = null;
		let currentPath = this.selectedTab?.editor.document.path;
		
		if (currentPath) {
			dir = platform.path.resolve(currentPath, "..");
		}
		
		let files = await bluebird.map(platform.open(dir), async function(path) {
			return {
				path,
				code: await platform.fs(path).read(),
			};
		});
		
		for (let {path, code} of files) {
			this.openFile(path, code);
		}
	},
	
	save() {
		if (!this.selectedTab) {
			return;
		}
		
		this.save(this.selectedTab);
	},
	
	_new() {
		this.newFile();
	},
	
	find() {
		if (!this.selectedTab) {
			return;
		}
		
		this.showFindBar();
	},
	
	findInOpenFiles() {
		if (platform.showFindDialog) {
			platform.showFindDialog({
				search: "openFiles",
			});
		} else {
			// TODO
		}
	},
	
	findAndReplace() {
		if (platform.showFindDialog) {
			platform.showFindDialog({
				replace: true,
			});
		} else {
			// TODO
		}
	},
	
	findAndReplaceInOpenFiles() {
		if (platform.showFindDialog) {
			platform.showFindDialog({
				search: "openFiles",
				replace: true,
			});
		} else {
			// TODO
		}
	},
	
	selectNextTab() {
		this.selectNextTab(1);
	},
	
	selectPrevTab() {
		this.selectNextTab(-1);
	},
	
	closeTab() {
		if (!this.selectedTab) {
			return;
		}
		
		this.closeTab(this.selectedTab);
	},
	
	async reopenLastClosedTab() {
		let details = this.closedTabs.shift();
		
		if (!details) {
			return;
		}
		
		let tab = await this.openFile(details.path);
		
		tab.restoreState(details);
	},
};
