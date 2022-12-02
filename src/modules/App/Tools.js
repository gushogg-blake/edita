let Evented = require("utils/Evented");
let mapArrayToObject = require("utils/mapArrayToObject");
let FindResults = require("modules/app/FindResults");
let RefactorTab = require("./RefactorTab");
let ClippingsTab = require("./ClippingsTab");

class Tools {
	constructor(app) {
		this.app = app;
		
		this.findResults = new FindResults(app);
		this.clippingsEditor = app.createEditor();
		
		this.clippingsEditor.view.setWrap(true);
		
		this.findResultsTab = new FindResultsTab(this, this.findResults);
		this.clippingsTab = new ClippingsTab(this, this.clippingsEditor);
		
		this.tabs = [
			this.findResultsTab,
			this.clippingsTab,
		];
		
		this.selectedTab = this.findResultsTab;
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
