let Evented = require("utils/Evented");
let mapArrayToObject = require("utils/mapArrayToObject");
let FindResults = require("./FindResults");

class BottomPane extends Evented {
	constructor(app) {
		super();
		
		this.app = app;
		
		this.findResults = new FindResults(app);
		this.clippingsEditor = app.createEditor();
		
		this.clippingsEditor.view.show();
		
		this.tabs = [
			{
				id: "findResults",
				label: "Find results",
			},
			{
				id: "clippings",
				label: "Clippings",
			},
			{
				id: "log",
				label: "Log",
			},
			{
				id: "commandLine",
				label: "Command line",
			},
		];
		
		this.tabsById = mapArrayToObject(this.tabs, tab => [tab.id, tab]);
		
		this.selectedTab = this.tabsById.findResults;
	}
	
	selectTab(tab) {
		this.selectedTab = tab;
		
		this.fire("selectTab");
	}
	
	showFindResults(results) {
		this.findResults.add(results);
		
		this.selectTab(this.tabsById.findResults);
		
		this.app.showPane("bottom");
	}
	
	addClipping(str) {
		this.clippingsEditor.api.edit(this.clippingsEditor.document.cursorAtStart(), str + "\n\n");
	}
}

module.exports = BottomPane;
