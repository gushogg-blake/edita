let TabPane = require("./TabPane");
let Refactor = require("./Refactor");
let RefactorTab = require("./RefactorTab");

class ToolsPane extends TabPane {
	constructor(app, paneName) {
		super(paneName);
		
		this.app = app;
	}
	
	async createRefactorTab(paths) {
		let refactor = new Refactor(app, {
			searchIn: "files",
			globs: paths.map(path => platform.fs(path).child("**", "*").path),
		});
		
		let tab = new RefactorTab(this.app, refactor);
		
		await tab.init();
		
		return tab;
	}
	
	async refactor(paths) {
		let tab = await this.createRefactorTab(paths);
		
		this.tabs.push(tab);
		
		this.fire("updateTabs");
		
		this.show();
		
		this.selectTab(tab);
	}
}

module.exports = ToolsPane;
