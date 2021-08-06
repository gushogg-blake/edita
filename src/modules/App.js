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
	
	async save(tab=this.selectedTab) {
		let document = tab?.document;
		
		if (!document) {
			return null;
		}
		
		if (document.path) {
			await document.save();
		} else {
			let path = await platform.saveAs();
			
			if (path) {
				await document.saveAs(path);
			}
		}
		
		return document.path;
	}
	
	selectTab(tab) {
		this.selectedTab?.view.hide();
		
		this.selectedTab = tab;
		
		tab.view.show();
		tab.view.focus();
		
		this.fire("selectTab")
	}
	
	async closeTab(tab) {
		let {
			path,
			modified,
		} = tab.document;
		
		if (modified) {
			let {response} = await platform.showMessageBox({
				message: "Save changes to " + (path ? platform.fs(path).name : "new file") + "?",
				buttons: ["Yes", "No", "Cancel"],
			});
			
			if (response === 0) {
				let path = await this.save(tab);
				
				if (!path) {
					return;
				}
			} else if (response === 2) {
				return;
			}
		}
		
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
		let existingTab = this.findTabByPath(path);
		
		if (existingTab) {
			this.selectTab(existingTab);
			
			return;
		}
		
		let fileDetails = base.getFileDetails(code, path);
		
		if (fileDetails.hasMixedNewlines) {
			// TODO prompt to change all newlines
			// needed as fileDetails.newline.length is currently used for e.g.
			// calculating line start offsets
		}
		
		let document = this.createDocument(code, path, fileDetails);
		let view = new View(this, document);
		let editor = new Editor(this, document, view);
		
		let tab = {
			document,
			editor,
			view,
		};
		
		this.tabs.push(tab);
		
		this.fire("updateTabs");
		
		this.selectTab(tab);
	}
	
	newFile() {
		let fileDetails = base.getDefaultFileDetails();
		
		let document = this.createDocument("", null, fileDetails);
		let view = new View(this, document);
		let editor = new Editor(this, document, view);
		
		let tab = {
			document,
			editor,
			view,
		};
		
		this.tabs.push(tab);
		
		this.fire("updateTabs");
		
		this.selectTab(tab);
	}
	
	createDocument(code, path, fileDetails) {
		let document = new Document(code, path, fileDetails);
		
		for (let event of ["edit", "undo", "redo", "save"]) {
			document.on(event, (...args) => {
				this.fire("document." + event, document, ...args);
			});
		}
		
		return document;
	}
	
	findTabByPath(path) {
		for (let tab of this.tabs) {
			if (tab.document.path === path) {
				return tab;
			}
		}
		
		return null;
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
