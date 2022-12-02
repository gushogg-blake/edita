let Evented = require("utils/Evented");
let Refactor = require("modules/Refactor");
let FindResults = require("./FindResults");
let FindResultsTab = require("./FindResultsTab");
let ClippingsTab = require("./ClippingsTab");
let RefactorTab = require("./RefactorTab");

class Tools extends Evented {
	constructor(app) {
		super();
		
		this.app = app;
		
		this.findResults = new FindResults(app);
		this.clippingsEditor = app.createEditor();
		
		this.findResultsTab = new FindResultsTab(app, this.findResults);
		this.clippingsTab = new ClippingsTab(app, this.clippingsEditor);
		
		this.tabs = [
			this.findResultsTab,
			this.clippingsTab,
		];
		
		this.selectedTab = this.findResultsTab;
	}
	
	async createRefactorTab(paths) {
		let refactor = new Refactor({
			paths,
		});
		
		let tab = new RefactorTab(this.app, refactor);
		
		await tab.init();
		
		return tab;
	}
	
	async refactor(paths) {
		let tab = await this.createRefactorTab(paths);
		
		this.tabs.push(tab);
		
		this.fire("updateTabs");
		
		this.selectTab(tab);
	}
	
	focusSelectedTab() {
		this.selectedTab?.focus();
	}
	
	focusSelectedTabAsync() {
		setTimeout(() => {
			this.focusSelectedTab();
		}, 0);
	}
	
	selectTab(tab) {
		this.selectedTab?.hide();
		
		this.selectedTab = tab;
		
		tab.show();
		
		this.fire("selectTab");
		
		this.focusSelectedTabAsync();
	}
	
	showFindResults(action, options, results) {
		this.findResults.add(action, options, results);
		
		this.selectTab(this.findResultsTab);
		
		this.show();
	}
	
	setVisibility(show) {
		super.setVisibility(show);
		
		if (show) {
			this.selectTab.show();
		} else {
			this.tabs.forEach(tab => tab.hide);
		}
	}
}

module.exports = Tools;
