import FindResults from "ui/FindResults";
import FindResultsTab from "./tabs/FindResultsTab";
import ClippingsTab from "./tabs/ClippingsTab";

class Output {
	constructor(app) {
		this.app = app;
		this.pane = app.panes.output;
		
		this.findResults = new FindResults(app);
		
		this.findResultsTab = new FindResultsTab(app, this.findResults);
		this.clippingsTab = new ClippingsTab(app);
		
		this.pane.setTabs([
			this.findResultsTab,
			this.clippingsTab,
		]);
		
		this.pane.selectTab(this.findResultsTab);
		
		this.teardownCallbacks = [
			platform.clipboard.on("set", (str) => {
				this.clippingsTab.addClipping(str);
			});
			
			app.on("teardown", this.teardown.bind(this)),
		];
	}
	
	showFindResults(action, options, results) {
		this.findResults.add(action, options, results);
		
		this.pane.selectTab(this.findResultsTab);
		
		this.app.bottomPanes.configure(null, true);
	}
	
	teardown() {
		for (let fn of this.teardownCallbacks) {
			fn();
		}
	}
}

export default Output;
