import {removeInPlace} from "utils/array";
import Evented from "utils/Evented";

class TabPane extends Evented {
	constructor(state) {
		super();
		
		// keep a reference to the related state for convenience
		// we don't modify it; BottomPanes handles that
		this.state = state;
		this.tabs = [];
		this.selectedTab = null;
		this.previouslySelectedTabs = [];
	}
	
	show() {
		this.setVisibility(true);
	}
	
	hide() {
		this.setVisibility(false);
	}
	
	resize() {
		this.selectedTab?.resize();
	}
	
	setVisibility(visible) {
		if (visible) {
			this.selectedTab?.show();
		} else {
			this.tabs.forEach(tab => tab.hide());
		}
	}
	
	setTabs(tabs) {
		for (let tab of this.tabs) {
			this.closeTab(tab);
		}
		
		this.tabs = tabs;
		
		this.fire("updateTabs");
	}
	
	addTab(tab) {
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
		if (this.selectedTab) {
			this.addToPreviouslySelectedTabs(this.selectedTab);
		}
		
		this.selectedTab?.hide();
		
		this.selectedTab = tab;
		
		tab.select();
		tab.show();
		
		this.fire("selectTab", tab);
		
		this.focusSelectedTabAsync();
	}
	
	findTabByUrl(url) {
		return this.tabs.find(tab => tab.url.toString() === url.toString());
	}
	
	selectTabByUrl(url) {
		let tab = this.findTabByUrl(url);
		
		if (tab) {
			this.selectTab(tab);
		}
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
}

export default TabPane;
