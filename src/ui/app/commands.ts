import bluebird from "bluebird";
import {FileLikeURL} from "core";
import {App} from "ui/app";

/*
functions available to be bound to key presses/buttons
*/

export default {
	async open() {
		let dir = this.getCurrentDir(platform.systemInfo.homeDir);
		let urls = (await this.dialogs.showOpen(dir)).map(path => FileLikeURL.file(path));
		let files = await this.readFiles(urls);
		
		for (let file of files) {
			this.fileOperations.openFile(file);
		}
		
		platform.showWindow();
	},
	
	save() {
		if (!this.mainTabs.selectedTab) {
			return;
		}
		
		this.fileOperations.save(this.mainTabs.selectedTab);
	},
	
	saveAs() {
		if (!this.mainTabs.selectedTab) {
			return;
		}
		
		this.fileOperations.saveAs(this.mainTabs.selectedTab);
	},
	
	saveAll() {
		this.fileOperations.saveAll();
	},
	
	_new() {
		this.fileOperations.newFile();
	},
	
	newWithLangSelector() {
		this.openLangSelector();
	},
	
	fastOpen() {
		this.showQuickAction("fastOpen");
	},
	
	commandPalette() {
		this.showQuickAction("commandPalette");
	},
	
	findInOpenFiles() {
		this.findAndReplace.findInOpenFiles();
	},
	
	replaceInOpenFiles() {
		this.showFindAndReplace({
			replace: true,
			searchIn: "openFiles",
		});
	},
	
	selectNextTab() {
		this.selectNextTab(1);
	},
	
	selectPrevTab() {
		this.selectNextTab(-1);
	},
	
	closeTab() {
		if (!this.mainTabs.selectedTab) {
			return;
		}
		
		this.closeTab(this.mainTabs.selectedTab);
	},
	
	async closeAllTabs() {
		for (let tab of [...this.tabs]) {
			await this.closeTab(tab);
		}
	},
	
	async reopenLastClosedTab() {
		let details = this.closedTabs.shift();
		
		if (!details) {
			return;
		}
		
		let tab = await this.openFile(details.url);
		
		tab.restoreState(details);
	},
	
	toggleLeftPane() {
		this.panes.left.toggle();
	},
	
	toggleRightPane() {
		this.panes.right.toggle();
	},
		
	toggleBottomPane() {
		this.panes.bottom.toggle();
	},
	
	focusEditor() {
		this.focusSelectedTab();
	},
	
	toggleDevToolbar() {
		base.setPref("dev.showToolbar", !base.getPref("dev.showToolbar"));
	},
};
