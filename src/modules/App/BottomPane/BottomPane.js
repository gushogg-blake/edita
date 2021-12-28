let Evented = require("utils/Evented");
let mapArrayToObject = require("utils/mapArrayToObject");
let Pane = require("../Pane");
let FindResults = require("./FindResults");

class BottomPane extends Pane {
	constructor(app) {
		super("bottom");
		
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
			//{
			//	id: "log",
			//	label: "Log",
			//},
			//{
			//	id: "commandLine",
			//	label: "Command line",
			//},
		];
		
		this.tabsById = mapArrayToObject(this.tabs, tab => [tab.id, tab]);
		
		this.selectedTab = this.tabsById.findResults;
	}
	
	selectTab(tab) {
		this.selectedTab = tab;
		
		if (tab === this.tabsById.clippings) {
			this.clippingsEditor.focusAsync();
		}
		
		this.updateClippingsEditorVisibility();
		
		this.fire("selectTab");
	}
	
	showFindResults(options, results) {
		this.findResults.add(options, results);
		
		this.selectTab(this.tabsById.findResults);
		
		this.show();
	}
	
	addClipping(str) {
		let {newline} = this.clippingsEditor.document.fileDetails;
		
		this.clippingsEditor.api.edit(this.clippingsEditor.document.cursorAtStart(), str + newline + newline);
	}
	
	setVisibility(show) {
		super.setVisibility(show);
		
		this.updateClippingsEditorVisibility();
	}
	
	updateClippingsEditorVisibility() {
		if (this.visible && this.selectedTab === this.tabsById.clippings) {
			this.clippingsEditor.view.show();
		} else {
			this.clippingsEditor.view.hide();
		}
	}
}

module.exports = BottomPane;
