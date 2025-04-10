import bluebird from "bluebird";
import {URL, File} from "core";
import type App from "ui/App";
import type {SavedState} from "./tabs/EditorTab";

export type TabDescriptor = {
	file: File,
	state?: any;
};

export default class {
	private app: App;
	
	constructor(app: App) {
		this.app = app;
	}
	
	async loadSessionAndFilesToOpenOnStartup() {
		let tabsFromSession = [];
		let urlToSelect = null;
		
		if (platform.isMainWindow) {
			let session = await base.stores.session.load();
			
			if (session) {
				let {mainTabs} = session;
				let {tabs, selectedTabUrl} = mainTabs;
				let files = await this.app.readFilesByUrl(tabs.map(tab => URL.fromString(tab.url)));
				
				tabsFromSession = await bluebird.map(tabs, ({url: urlString, state}) => {
					let file = files[urlString];
					
					return file ? {
						file,
						state,
					} : null;
				}).filter(Boolean);
				
				if (selectedTabUrl && files[selectedTabUrl]) {
					urlToSelect = URL.fromString(selectedTabUrl);
				}
			}
		}
		
		let tabsFromStartup = (await this.app.readFiles(platform.urlsToOpenOnStartup)).filter((file) => {
			return !tabsFromSession.find(function(tab) {
				return tab.url.toString() === file.url.toString();
			});
		}).map(file => ({file}));
		
		if (tabsFromStartup.length > 0) {
			urlToSelect = tabsFromStartup.at(-1).file.url;
		}
		
		await this.app.mainTabs.loadFromSessionAndStartup({
			tabs: [...tabsFromSession, ...tabsFromStartup],
			urlToSelect,
		});
	}
	
	async saveSession() {
		await base.stores.session.save({
			mainTabs: this.app.mainTabs.saveSession(),
		});
	}
	
	/*
	load/save ephemeral state like selected tabs
	*/
	
	async saveEphemeralUiState() {
		await base.stores.ephemeralUiState.save({
			// TODO see comment in restoreEphemeralUiState
			//selectedTabs: {
			//	tools: this.tools.pane.selectedTab.url,
			//	output: this.output.pane.selectedTab.url,
			//},
			
			expandedDirs: [...this.app.fileTree.expandedDirs],
		});
	}
	
	async restoreEphemeralUiState() {
		let state = await base.stores.ephemeralUiState.load();
		
		if (!state) {
			return;
		}
		
		let {expandedDirs} = state;
		
		// TODO for bottom panes, use a single object and pass it
		// to bottomPanes - doing it piecemeal with selectTab will
		// have the unwanted effect of also expanding whichever
		// tab is selected, so it will always be open on init
		
		this.app.fileTree.setExpandedDirs(expandedDirs || []);
	}
}
