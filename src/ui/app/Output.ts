import type {App} from "ui/app";
import type {TabPane} from "ui/app/panes";
import {FindResults} from "ui/findResults";
import FindResultsTab from "./tabs/FindResultsTab";
import ClippingsTab from "./tabs/ClippingsTab";

export default class Output {
	findResults: FindResults;
	findResultsTab: FindResultsTab;
	clippingsTab: ClippingsTab;
	
	private app: App;
	private pane: TabPane;
	private teardownCallbacks: Array<() => void>;
	
	constructor(app: App) {
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
			}),
			
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
