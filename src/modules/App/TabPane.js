let {removeInPlace} = require("utils/arrayMethods");
let Pane = require("./Pane");

class TabPane extends Pane {
	constructor(name, size, visible, expanded) {
		super(name, size, visible);
		
		this.expanded = expanded;
		
		this.tabs = [];
		this.selectedTab = null;
		this.previouslySelectedTabs = [];
	}
	
	get totalSize() {
		let {size} = this;
		
		this.fire("requestTotalSize", function(s) {
			size = s;
		});
		
		return size;
	}
	
	get contentSize() {
		let {size} = this;
		
		this.fire("requestContentSize", function(s) {
			size = s;
		});
		
		return size;
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
	
	expand() {
		this.expanded = true;
		
		this.fire("update");
		this.fire("expand");
	}
	
	collapse() {
		this.expanded = false;
		
		this.fire("update");
		this.fire("collapse");
	}
	
	setVisibility(show) {
		if (show) {
			this.selectedTab?.show();
		} else {
			this.tabs.forEach(tab => tab.hide());
		}
	}
	
	uiMounted() {
		this.fire("update");
	}
}

module.exports = TabPane;
