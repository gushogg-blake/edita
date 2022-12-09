let FindResults = require("./FindResults");
let FindResultsTab = require("./FindResultsTab");
let ClippingsTab = require("./ClippingsTab");

class Output {
	constructor(app) {
		this.app = app;
		this.pane = app.panes.output;
		
		this.findResults = new FindResults(app);
		this.clippingsEditor = app.createEditor();
		
		this.findResultsTab = new FindResultsTab(app, this.findResults);
		this.clippingsTab = new ClippingsTab(app, this.clippingsEditor);
		
		this.pane.setTabs([
			this.findResultsTab,
			this.clippingsTab,
		]);
		
		this.pane.selectTab(this.findResultsTab);
	}
	
	showFindResults(action, options, results) {
		this.findResults.add(action, options, results);
		
		this.selectTab(this.findResultsTab);
		
		this.app.bottomPanes.showFindResults();
	}
}

module.exports = Output;
