import bluebird from "bluebird";
import File from "modules/core/resources/File";

type TabDescriptor = {
	file: File,
	state?: any; // TODO saved tab state
};

export default class {
	constructor(app) {
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
				
				tabsFromSession = await bluebird.map(tabs, async function({url: urlString, state}) {
					let url = new URL(urlString);
					
					return {
						file: await File.read(url),
						state,
					};
				});
				
				if (selectedTabUrl) {
					urlToSelect = new URL(selectedTabUrl);
				}
			}
		}
		
		let tabsFromStartup = (await bluebird.map(
			platform.getFilesToOpenOnStartup(),
			async function(path) {
				return {
					file: await File.read(URL.file(path)),
				};
			},
		)).filter(({file}) => {
			return !tabsFromSession.find(function(tab) {
				return tab.url === file.url;
			});
		});
		
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
			
			expandedDirs: [...this.fileTree.expandedDirs],
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
		
		this.fileTree.setExpandedDirs(expandedDirs || []);
	}
}
