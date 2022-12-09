let FindAndReplaceTab = require("./FindAndReplaceTab");
let Refactor = require("./Refactor");
let RefactorTab = require("./RefactorTab");

class Tools {
	constructor(app) {
		this.app = app;
		this.pane = app.panes.tools;
		
		this.findAndReplaceTab = new FindAndReplaceTab(app);
		
		this.pane.setTabs([
			this.findAndReplaceTab,
		]);
		
		this.pane.selectTab(this.findAndReplaceTab);
	}
	
	async createRefactorTab(paths) {
		let refactor = new Refactor(this.app, {
			searchIn: "files",
			globs: paths.map(path => platform.fs(path).child("**", "*").path),
		});
		
		let tab = new RefactorTab(this.app, refactor);
		
		await tab.init();
		
		return tab;
	}
	
	async refactor(paths) {
		let tab = await this.createRefactorTab(paths);
		
		this.pane.addTab(tab);
		
		this.app.bottomPanes.configure(true, false);
	}
	
	findAndReplace(options) {
		this.app.findAndReplace.options = options; // TODO probs need to trigger component (FindAndReplace.svelte) to update
		
		this.pane.selectTab(this.findAndReplaceTab);
		
		this.app.bottomPanes.configure(true, true);
	}
}

module.exports = Tools;
