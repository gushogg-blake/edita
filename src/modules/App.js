let {remove} = require("../utils/arrayMethods");
let Evented = require("../utils/Evented");
let focusManager = require("../utils/focusManager");
let Document = require("./Document");
let Editor = require("./Editor/Editor");
let View = require("./View/View");

class App extends Evented {
	constructor() {
		super();
		
		this.tabs = [];
		this.selectedTab = null;
		
		this.focusManager = focusManager();
	}
	
	async open() {
		let files = await platform.open();
		
		for (let {path, code} of files) {
			this.openFile(path, code);
		}
	}
	
	async save() {
		if (!this.selectedTab) {
			return;
		}
		
		if (this.selectedTab.path) {
			//await platform.save(path, document.toString());
		} else {
			// TODO save dialog
		}
	}
	
	undo() {
		this.selectedTab?.editor.undo();
	}
	
	redo() {
		this.selectedTab?.editor.redo();
	}
	
	find() {
		if (!this.selectedTab) {
			return;
		}
		
		this.showFindBar();
	}
	
	findInOpenFiles() {
		if (platform.showFindDialog) {
			platform.showFindDialog({
				search: "openFiles",
			});
		} else {
			// TODO
		}
	}
	
	findAndReplace() {
		if (platform.showFindDialog) {
			platform.showFindDialog({
				replace: true,
			});
		} else {
			// TODO
		}
	}
	
	findAndReplaceInOpenFiles() {
		if (platform.showFindDialog) {
			platform.showFindDialog({
				search: "openFiles",
				replace: true,
			});
		} else {
			// TODO
		}
	}
	
	openFile(path, code) {
		let tab = this.findTabByPath(path);
		
		if (tab) {
			this.selectTab(tab);
			
			return;
		}
		
		let fileDetails = base.getFileDetails(code, path);
		
		if (fileDetails.hasMixedNewlines) {
			// TODO prompt to change all newlines
			// needed as fileDetails.newline.length is currently used for e.g.
			// calculating line start offsets
		}
		
		let document = new Document(code, fileDetails);
		let view = new View(this, document);
		let editor = new Editor(this, document, view);
		
		let newTab = {
			path,
			document,
			editor,
			view,
		};
		
		this.tabs.push(newTab);
		
		this.fire("updateTabs");
		
		this.selectTab(newTab);
	}
	
	findTabByPath(path) {
		for (let tab of this.tabs) {
			if (tab.path === path) {
				return tab;
			}
		}
		
		return null;
	}
	
	selectTab(tab) {
		this.selectedTab?.view.hide();
		
		this.selectedTab = tab;
		
		tab.view.show();
		tab.view.focus();
		
		this.fire("selectTab")
	}
	
	closeTab(tab) {
		// TODO check if modified
		
		let selectNext = null;
		
		if (this.selectedTab === tab) {
			let index = this.tabs.indexOf(tab);
			
			if (index > 0) {
				selectNext = this.tabs[index - 1];
			} else if (index < this.tabs.length - 1) {
				selectNext = this.tabs[index + 1];
			}
		}
		
		tab.view.teardown();
		
		this.tabs = remove(this.tabs, tab);
		
		this.fire("updateTabs");
		
		if (selectNext) {
			this.selectTab(selectNext);
		}
	}
	
	showFindBar() {
		this.fire("showFindBar");
	}
	
	hideFindBar() {
		this.fire("hideFindBar");
	}
	
	hideFindBarAndFocusEditor() {
		this.hideFindBar();
		
		if (this.selectedTab) {
			this.selectedTab.view.requestFocus();
		}
	}
	
	uiMounted() {
	}
}

module.exports = App;
