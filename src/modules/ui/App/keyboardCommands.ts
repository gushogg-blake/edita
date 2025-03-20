import bluebird from "bluebird";
import {URL} from "modules/core";
import {readFileForOpen, readFilesForOpen} from "modules/readFilesForOpen";

import App from "modules/ui/App";

/*
functions available to be bound to key presses
*/

export default {
	async open() {
		let dir = this.getCurrentDir(platform.systemInfo.homeDir);
		let urls = (await this.showOpenDialog(dir)).map(path => URL.file(path));
		let files = await readFilesForOpen(urls);
		
		for (let file of files) {
			this.fileOperations.openFile(file);
		}
		
		platform.showWindow();
	},
	
	save() {
		if (!this.selectedTab) {
			return;
		}
		
		this.save(this.selectedTab);
	},
	
	saveAs() {
		if (!this.selectedTab) {
			return;
		}
		
		this.saveAs(this.selectedTab);
	},
	
	saveAll() {
		this.saveAll();
	},
	
	_new() {
		this.newFile();
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
	
	find() {
		if (!this.selectedTab) {
			return;
		}
		
		this.showFindBar();
	},
	
	findInOpenFiles() {
		this.showFindAndReplace({
			replace: false,
			searchIn: "openFiles",
		});
	},
	
	replace() {
		if (!this.selectedTab) {
			return;
		}
		
		let {editor} = this.selectedTab;
		
		this.showFindAndReplace({
			replace: true,
			searchIn: editor.view.normalSelection.isMultiline() ? "selectedText" : "currentDocument",
		});
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
		if (!this.selectedTab) {
			return;
		}
		
		this.closeTab(this.selectedTab);
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
