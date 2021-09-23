let Evented = require("utils/Evented");

class BottomPane extends Evented {
	constructor(app) {
		super();
		
		this.app = app;
		
		this.tabs = [
			{
				id: "findResults",
				label: "Find results",
			},
		];
		
		this.selectedTab = this.tabs[0];
	}
	
	selectTab(tab) {
		this.selectedTab = tab;
		
		this.fire("selectTab");
	}
}

module.exports = BottomPane;
