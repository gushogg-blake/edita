export default class {
	constructor(app) {
		this.app = app;
	}
	
	async loadSessionAndFilesToOpenOnStartup() {
		let tabsToOpen = [];
		let fileToSelect;
		
		if (platform.isMainWindow) {
			let session = await base.stores.session.load();
			
			if (session) {
				tabsToOpen = session.tabs;
				fileToSelect = session.selectedTabUrl;
			}
		}
		
		let filesToOpenOnStartup = platform.getFilesToOpenOnStartup().map(function(path) {
			return {
				isNew: true,
				url: URL.file(path),
			};
		}).filter(({url}) => !tabsToOpen.find(tab => url.toString() === tab.url.toString()));
		
		tabsToOpen.push(...filesToOpenOnStartup);
		
		if (filesToOpenOnStartup.length > 0) {
			fileToSelect = filesToOpenOnStartup.at(-1).url;
		}
		
		this.tabs = await bluebird.map(tabsToOpen, async ({url: urlString}) => {
			let url = URL.fromString(urlString);
			
			try {
				return this.createEditorTab(await protocol(url).read(), url);
			} catch (e) {
				console.error(e);
				
				return null;
			}
		}).filter(Boolean);
		
		for (let details of tabsToOpen) {
			if (!details.isNew) {
				this.findTabByUrl(details.url)?.restoreState(details);
			}
		}
		
		if (this.editorTabs.length > 0) {
			this.selectTab(fileToSelect && this.findTabByUrl(fileToSelect) || this.editorTabs.at(-1));
		} else {
			this.initialNewFileTab = await this.newFile();
		}
		
		this.fire("updateTabs");
	}
	
	async saveSession() {
		let tabs = this.editorTabs.map(function(tab) {
			return tab.isSaved ? tab.saveState() : null;
		}).filter(Boolean);
		
		await base.stores.session.save({
			tabs,
			selectedTabUrl: this.selectedTab?.url.toString(),
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
