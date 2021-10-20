let bluebird = require("bluebird");

module.exports = {
	async open() {
		let dir = null;
		
		if (this.lastSelectedPath) {
			dir = platform.path.resolve(this.lastSelectedPath, "..");
		}
		
		let files = await bluebird.map(platform.open(dir), async function(path) {
			return {
				path,
				code: await platform.fs(path).read(),
			};
		});
		
		for (let {path, code} of files) {
			this.openPath(path, code);
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
		this.showFindDialog({
			replace: false,
			searchIn: "openFiles",
		});
	},
	
	replace() {
		if (!this.selectedTab) {
			return;
		}
		
		let {editor} = this.selectedTab;
		
		this.showFindDialog({
			replace: true,
			searchIn: editor.view.Selection.isFull() ? "selectedText" : "currentDocument",
		});
	},
	
	replaceInOpenFiles() {
		this.showFindDialog({
			replace: true,
			searchIn: "openFiles",
		});
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
	
	async closeAllTabs() {
		for (let tab of this.tabs) {
			await this.closeTab(tab);
		}
	},
	
	async reopenLastClosedTab() {
		let details = this.closedTabs.shift();
		
		if (!details) {
			return;
		}
		
		let tab = await this.openFile(details.url);
		
		tab.restoreState(details);
	},
};
