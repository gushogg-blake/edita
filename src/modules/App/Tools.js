let Refactor = require("./Refactor");
let RefactorTab = require("./RefactorTab");

class Tools {
	constructor(app) {
		this.app = app;
		this.pane = app.panes.tools;
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
		
		this.app.bottomPanes.showRefactor();
	}
}

module.exports = Tools;
