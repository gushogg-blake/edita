let Evented = require("utils/Evented");
let mapArrayToObject = require("utils/mapArrayToObject");
let FindResults = require("./FindResults");

class BottomPane extends Evented {
	constructor(app) {
		super();
		
		this.app = app;
		
		this.findResults = new FindResults(app);
		this.clippingsEditor = app.createEditor();
		
		this.clippingsEditor.view.setWrap(true);
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
		
		if (tab === this.tabsById.clippings) {
			this.clippingsEditor.focusAsync();
		}
		
		this.fire("selectTab");
	}
	
	showFindResults(results) {
		this.findResults.add(results);
		
		this.selectTab(this.tabsById.findResults);
		
		this.app.showPane("bottom");
	}
	
	addClipping(str) {
		let {newline} = this.clippingsEditor.document.fileDetails;
		
		this.clippingsEditor.api.edit(this.clippingsEditor.document.cursorAtStart(), str + newline + newline);
	}
}

module.exports = BottomPane;
