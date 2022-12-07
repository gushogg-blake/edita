let TabPane = require("./TabPane");
let FindResults = require("./FindResults");
let FindResultsTab = require("./FindResultsTab");
let ClippingsTab = require("./ClippingsTab");

class OutputPane extends TabPane {
	constructor(app, paneName) {
		super(paneName);
		
		this.app = app;
		
		this.findResults = new FindResults(app);
		this.clippingsEditor = app.createEditor();
		
		this.findResultsTab = new FindResultsTab(app, this.findResults);
		this.clippingsTab = new ClippingsTab(app, this.clippingsEditor);
		
		this.tabs = [
			this.findResultsTab,
			this.clippingsTab,
		];
		
		this.selectedTab = this.findResultsTab;
	}
	
	showFindResults(action, options, results) {
		this.findResults.add(action, options, results);
		
		this.selectTab(this.findResultsTab);
		
		this.show();
	}
}

module.exports = OutputPane;
