let bluebird = require("bluebird");
let {remove, moveInPlace} = require("utils/arrayMethods");
let Evented = require("utils/Evented");
let focusManager = require("utils/focusManager");
let Document = require("modules/Document");
let Tab = require("modules/Tab");
let Editor = require("modules/Editor/Editor");
let View = require("modules/View/View");

class App extends Evented {
	constructor() {
		super();
		
		this.tabs = [];
		this.selectedTab = null;
		
		this.showingPane = {
			left: base.getPref("showPane.left"),
			bottom: base.getPref("showPane.bottom"),
			right: base.getPref("showPane.right"),
		};
		
		this.focusManager = focusManager();
		
		this.teardownCallbacks = [
			platform.on("closeWindow", this.onCloseWindow.bind(this)),
		];
	}
	
	async open() {
		let dir = null;
		let currentPath = this.selectedTab?.editor.document.path;
		
		if (currentPath) {
			dir = platform.path.resolve(currentPath, "..");
		}
		
		let files = await bluebird.map(platform.open(dir), async function(path) {
			return {
				path,
				code: await platform.fs(path).read(),
			};
		});
		
		for (let {path, code} of files) {
			this.openFile(path, code);
		}
	}
	
	async save(tab=this.selectedTab) {
		let document = tab?.editor.document;
		
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
	
	_new() {
		this.newFile();
	}
	
	async renameTab(tab) {
		let oldPath = tab.editor.document.path;
		let path = await platform.saveAs();
		
		if (path) {
			await tab.editor.document.saveAs(path);
			await platform.fs(oldPath).delete();
		}
	}
	
	reorderTab(tab, index) {
		moveInPlace(this.tabs, tab, index);
		
		this.fire("updateTabs");
	}
	
	selectTab(tab) {
		this.selectedTab?.editor.view.hide();
		
		this.selectedTab = tab;
		
		tab.editor.view.show();
		tab.editor.view.focus();
		
		this.fire("selectTab")
	}
	
	async closeTab(tab) {
		let {
			path,
			modified,
		} = tab.editor.document;
		
		if (modified) {
			let {response} = await platform.showMessageBox({
				message: "Save changes to " + (path ? platform.fs(path).name : "new file") + "?",
				buttons: ["&Yes", "&No", "&Cancel"],
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
		
		tab.teardown();
		
		this.tabs = remove(this.tabs, tab);
		
		this.fire("updateTabs");
		
		if (selectNext) {
			this.selectTab(selectNext);
		}
	}
	
	togglePane(name) {
		this.showingPane[name] = !this.showingPane[name];
		
		base.setPref("showPane." + name, this.showingPane[name]);
		
		this.fire("updatePanes");
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
	
	showFindBar() {
		this.fire("showFindBar");
	}
	
	hideFindBar() {
		this.fire("hideFindBar");
	}
	
	hideFindBarAndFocusEditor() {
		this.hideFindBar();
		
		if (this.selectedTab) {
			this.selectedTab.editor.view.requestFocus();
		}
	}
	
	async openFile(path, code=null) {
		path = platform.fs(path).path;
		
		let existingTab = this.findTabByPath(path);
		
		if (existingTab) {
			this.selectTab(existingTab);
			
			return;
		}
		
		if (!code) {
			code = await platform.fs(path).read();
		}
		
		let fileDetails = base.getFileDetails(code, path);
		
		if (fileDetails.hasMixedNewlines) {
			// TODO prompt to change all newlines
			// needed as fileDetails.newline.length is currently used for e.g.
			// calculating line start offsets
		}
		
		let tab = this.createTab(code, path);
		
		this.tabs.push(tab);
		
		this.fire("updateTabs");
		
		this.selectTab(tab);
	}
	
	newFile() {
		let tab = this.createTab("", null);
		
		this.tabs.push(tab);
		
		this.fire("updateTabs");
		
		this.selectTab(tab);
	}
	
	createTab(code, path) {
		let document = this.createDocument(code, path);
		let view = new View(this, document);
		let editor = new Editor(this, document, view);
		
		return new Tab(this, editor);
	}
	
	createDocument(code, path) {
		let document = new Document(code, path);
		
		for (let event of ["edit", "undo", "redo", "save"]) {
			document.on(event, (...args) => {
				this.fire("document." + event, document, ...args);
			});
		}
		
		return document;
	}
	
	findTabByPath(path) {
		for (let tab of this.tabs) {
			if (tab.editor.document.path === path) {
				return tab;
			}
		}
		
		return null;
	}
	
	async loadSession() {
		try {
			let session = await platform.loadJson("session");
			
			if (!session) {
				return;
			}
			
			await bluebird.map(session.tabs, async (savedTab) => {
				let {
					path,
					mode,
					normalSelection,
					astSelection,
					scrollPosition,
				} = savedTab;
				
				await this.openFile(path);
				
				let tab = this.findTabByPath(path);
				
				if (!tab) {
					return;
				}
				
				let {editor} = tab;
				
				editor.view.setScrollPosition(scrollPosition);
				
				editor.setMode(mode);
				
				if (mode === "normal") {
					editor.setNormalSelection(normalSelection);
				} else {
					editor.setAstSelection(astSelection);
				}
				
				editor.view.ensureSelectionIsOnScreen();
			});
			
			if (this.tabs.length > 0) {
				this.selectTab(this.findTabByPath(session.selectedTabPath));
			}
		} catch (e) {
			console.error(e);
		}
	}
	
	async saveSession() {
		let tabs = this.tabs.map(function(tab) {
			let {path, editor} = tab;
			let {mode, normalSelection, astSelection, scrollPosition} = editor.view;
			
			return {
				path,
				mode,
				normalSelection,
				astSelection,
				scrollPosition,
			};
		});
		
		await platform.saveJson("session", {
			tabs,
			selectedTabPath: this.selectedTab?.path,
		});
	}
	
	uiMounted() {
	}
	
	onCloseWindow(e) {
		for (let tab of this.tabs) {
			if (tab.editor.document.modified) {
				e.preventDefault();
				
				break;
			}
		}
	}
	
	teardown() {
		for (let fn of this.teardownCallbacks) {
			fn();
		}
	}
}

module.exports = App;
