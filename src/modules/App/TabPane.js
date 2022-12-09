let {removeInPlace} = require("utils/arrayMethods");
let Evented = require("utils/Evented");

class TabPane extends Evented {
	constructor(size, visible, expanded) {
		super();
		
		this.size = size;
		this.visible = visible;
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
	
	resize(size) {
		this.fire("resize", size);
	}
	
	resizeAndSave(size) {
		this.resize(size);
		
		this.fire("save");
	}
	
	show() {
		this.fire("show");
	}
	
	hide() {
		this.fire("hide");
	}
	
	toggle() {
		if (this.visible) {
			this.hide();
		} else {
			this.show();
		}
	}
	
	setSize(size) {
		this.size = size;
		
		this.fire("update");
	}
	
	expand() {
		this.expanded = true;
		
		this.fire("update");
	}
	
	collapse() {
		this.expanded = false;
		
		this.fire("update");
	}
	
	setVisibility(visible) {
		this.visible = visible;
		
		this.fire("update");
		
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
}

module.exports = TabPane;
