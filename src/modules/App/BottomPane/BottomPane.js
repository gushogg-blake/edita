let Evented = require("utils/Evented");
let mapArrayToObject = require("utils/mapArrayToObject");
let FindResults = require("./FindResults");

class BottomPane extends Evented {
	constructor(app) {
		super();
		
		this.app = app;
		
		this.findResults = new FindResults();
		
		this.tabs = [
			{
				id: "findResults",
				label: "Find results",
			},
		];
		
		this.tabsById = mapArrayToObject(this.tabs, tab => [tab.id, tab]);
		
		this.selectedTab = this.tabsById.findResults;
	}
	
	selectTab(tab) {
		console.log(tab);
		this.selectedTab = tab;
		
		this.fire("selectTab");
	}
	
	showFindResults(results) {
		this.findResults.add(results);
		
		this.selectTab(this.tabsById.findResults);
	}
}

module.exports = BottomPane;
