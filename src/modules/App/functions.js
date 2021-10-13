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
		this.showFindDialog({
			replace: false,
			searchIn: "openFiles",
		});
	},
	
	replace() {
		this.showFindDialog({
			replace: true,
			searchIn: "currentDocument",
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
	
	async reopenLastClosedTab() {
		let details = this.closedTabs.shift();
		
		if (!details) {
			return;
		}
		
		let tab = await this.openFile(details.path);
		
		tab.restoreState(details);
	},
	
	toggleWrap() {
		platform.setPref("wrap", !platform.getPref("wrap"));
	},
};
