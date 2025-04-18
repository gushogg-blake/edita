import bluebird from "bluebird";
import type {App} from "ui/app";
import type {TabPane} from "ui/app/panes";
import {Refactor} from "ui/refactor";
import FindAndReplaceTab from "./tabs/FindAndReplaceTab";
import RefactorTab from "./tabs/RefactorTab";

export default class Tools {
	private app: App;
	private pane: TabPane;
	
	constructor(app: App) {
		this.app = app;
		this.pane = app.panes.tools;
		
		this.findAndReplaceTab = new FindAndReplaceTab(app);
		
		this.pane.setTabs([
			this.findAndReplaceTab,
		]);
		
		this.pane.selectTab(this.findAndReplaceTab);
	}
	
	async createRefactorTab(paths) {
		let refactor = new Refactor(this.app, {
			searchIn: "files",
			
			globs: await bluebird.map(paths, async function(path) {
				let node = platform.fs(path);
				
				if (await node.isDir()) {
					node = node.child("**", "*");
				}
				
				return node.path;
			}),
		});
		
		let tab = new RefactorTab(this.app, refactor);
		
		await tab.init();
		
		return tab;
	}
	
	async refactor(paths) {
		let tab = await this.createRefactorTab(paths);
		
		this.pane.addTab(tab);
		
		this.app.bottomPanes.configure(true, false);
	}
	
	findAndReplace(options) {
		this.app.findAndReplace.setOptions(options);
		
		this.pane.selectTab(this.findAndReplaceTab);
		
		this.app.bottomPanes.configure(true, true);
	}
}
