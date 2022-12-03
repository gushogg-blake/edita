let Evented = require("utils/Evented");
let {removeInPlace} = require("utils/arrayMethods");
let Refactor = require("modules/Refactor");
let Pane = require("./Pane");
let FindResults = require("./FindResults");
let FindResultsTab = require("./FindResultsTab");
let ClippingsTab = require("./ClippingsTab");
let RefactorTab = require("./RefactorTab");

class Tools extends Pane {
	constructor(app, panePosition) {
		super(panePosition);
		
		this.app = app;
		
		this.findResults = new FindResults(app);
		this.clippingsEditor = app.createEditor();
		
		this.findResultsTab = new FindResultsTab(app, this.findResults);
		this.clippingsTab = new ClippingsTab(app, this.clippingsEditor);
		
		this.tabs = [
			this.findResultsTab,
			this.clippingsTab,
		];
		
		this.previouslySelectedTabs = [];
		
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
		
		this.show();
		
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
		if (this.selectedTab) {
			this.addToPreviouslySelectedTabs(this.selectedTab);
		}
		
		this.selectedTab?.hide();
		
		this.selectedTab = tab;
		
		tab.show();
		
		this.fire("selectTab");
		
		this.focusSelectedTabAsync();
	}
	
	addToPreviouslySelectedTabs(tab) {
		removeInPlace(this.previouslySelectedTabs, tab);
		
		this.previouslySelectedTabs.push(tab);
		
		if (this.previouslySelectedTabs.length > 10) {
			this.previouslySelectedTabs.shift();
		}
	}
	
	closeTab(tab) {
		let selectNext = null;
		
		if (this.selectedTab === tab) {
			this.selectedTab = null;
			
			let prevSelected = this.previouslySelectedTabs.pop();
			
			if (prevSelected) {
				selectNext = prevSelected;
			} else {
				let index = this.tabs.indexOf(tab);
				
				if (index > 0) {
					selectNext = this.tabs[index - 1];
				} else if (index < this.tabs.length - 1) {
					selectNext = this.tabs[index + 1];
				}
			}
		}
		
		tab.teardown();
		
		removeInPlace(this.tabs, tab);
		removeInPlace(this.previouslySelectedTabs, tab);
		
		if (tab.isSaved && !noSave) {
			this.closedTabs.unshift(tab.saveState());
		}
		
		if (selectNext) {
			this.selectTab(selectNext);
		}
		
		this.fire("updateTabs");
		this.fire("tabClosed", tab);
	}
	
	showFindResults(action, options, results) {
		this.findResults.add(action, options, results);
		
		this.selectTab(this.findResultsTab);
		
		this.show();
	}
	
	setVisibility(show) {
		super.setVisibility(show);
		
		if (show) {
			this.selectedTab.show();
		} else {
			this.tabs.forEach(tab => tab.hide());
		}
	}
}

module.exports = Tools;
