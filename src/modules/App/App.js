let bluebird = require("bluebird");
let {remove, moveInPlace} = require("utils/arrayMethods");
let Evented = require("utils/Evented");
let focusManager = require("utils/focusManager");
let bindFunctions = require("utils/bindFunctions");
let replaceHomeDirWithTilde = require("utils/replaceHomeDirWithTilde");
let Document = require("modules/Document");
let Tab = require("modules/Tab");
let Editor = require("modules/Editor");
let View = require("modules/View");
let FileTree = require("./FileTree");
let functions = require("./functions");

class App extends Evented {
	constructor() {
		super();
		
		this.fileTree = new FileTree(this);
		this.tabs = [];
		this.selectedTab = null;
		this.closedTabs = [];
		
		this.showingPane = {
			left: platform.getPref("showPane.left"),
			bottom: platform.getPref("showPane.bottom"),
			right: platform.getPref("showPane.right"),
		};
		
		this.focusManager = focusManager();
		
		this.functions = bindFunctions(this, functions);
		
		this.teardownCallbacks = [
			platform.on("closeWindow", this.onCloseWindow.bind(this)),
			platform.on("openFromElectronSecondInstance", this.onOpenFromElectronSecondInstance.bind(this)),
		];
	}
	
	async init() {
		await Promise.all([
			this.loadSession(),
			this.fileTree.init(),
		]);
	}
	
	save(tab) {
		return tab.editor.save();
	}
	
	async renameTab(tab) {
		let oldPath = tab.editor.document.path;
		
		let path = await platform.saveAs({
			defaultPath: oldPath,
		});
		
		if (path && path !== oldPath) {
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
		
		this.updateTitle();
		
		this.fire("selectTab");
	}
	
	getTabName(tab) {
		let {path} = tab.editor.document;
		
		if (path) {
			return platform.fs(path).name;
		} else {
			return "New file";
		}
	}
	
	getTabLabel(tab) {
		return this.getTabName(tab) + (tab.editor.document.modified ? " *" : "");
	}
	
	async closeTab(tab) {
		let {
			path,
			modified,
		} = tab.editor.document;
		
		if (modified) {
			let {response} = await platform.showMessageBox({
				message: "Save changes to " + tab.name + "?",
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
		
		this.closedTabs.unshift(tab.saveState());
		
		if (tab === this.initialNewFileTab) {
			this.initialNewFileTab = null;
		}
		
		this.fire("updateTabs");
		
		if (selectNext) {
			this.selectTab(selectNext);
		}
	}
	
	togglePane(name) {
		this.showingPane[name] = !this.showingPane[name];
		
		platform.setPref("showPane." + name, this.showingPane[name]);
		
		this.fire("updatePanes");
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
		
		if (
			this.tabs.length === 1
			&& this.tabs[0] === this.initialNewFileTab
			&& !this.initialNewFileTab.modified
		) {
			this.closeTab(this.initialNewFileTab);
		}
		
		let existingTab = this.findTabByPath(path);
		
		if (existingTab) {
			this.selectTab(existingTab);
			
			return existingTab;
		}
		
		if (code === null) {
			code = await platform.fs(path).read();
		}
		
		let fileDetails = base.getFileDetails(code, path);
		
		if (fileDetails.hasMixedNewlines) {
			// TODO prompt to change all newlines
			// needed as fileDetails.newline.length is currently used for e.g.
			// calculating line start offsets
			
			throw "File " + path + " has mixed newlines";
		}
		
		let tab = this.createTab(code, path);
		
		this.tabs.push(tab);
		
		this.fire("updateTabs");
		
		this.selectTab(tab);
		
		return tab;
	}
	
	newFile() {
		let tab = this.createTab("", null);
		
		this.tabs.push(tab);
		
		this.fire("updateTabs");
		
		this.selectTab(tab);
		
		return tab;
	}
	
	createTab(code, path) {
		let document = this.createDocument(code, path);
		let view = new View(document, this.focusManager);
		let editor = new Editor(document, view);
		
		return new Tab(this, editor);
	}
	
	createDocument(code, path) {
		let document = new Document(code, path);
		
		for (let event of ["edit", "undo", "redo", "save"]) {
			document.on(event, (...args) => {
				this.updateTitle();
				
				this.fire("document." + event, document, ...args);
			});
		}
		
		return document;
	}
	
	createEditor() {
		let document = new Document("");
		let view = new View(document, this.focusManager);
		
		return new Editor(document, view);
	}
	
	findTabByPath(path) {
		for (let tab of this.tabs) {
			if (tab.editor.document.path === path) {
				return tab;
			}
		}
		
		return null;
	}
	
	selectNextTab(dir) {
		if (!this.selectedTab) {
			return;
		}
		
		let index = this.tabs.indexOf(this.selectedTab);
		let newIndex = index + dir;
		
		if (newIndex === -1) {
			newIndex = this.tabs.length - 1;
		}
		
		if (newIndex === this.tabs.length) {
			newIndex = 0;
		}
		
		this.selectTab(this.tabs[newIndex]);
	}
	
	onOpenFromElectronSecondInstance(files) {
		for (let path of files) {
			this.openFile(path);
		}
	}
	
	updateTitle() {
		let title = "";
		
		if (this.selectedTab) {
			title = this.getTabName(this.selectedTab);
			
			if (this.selectedTab.path) {
				title += " (" + replaceHomeDirWithTilde(platform.fs(this.selectedTab.path).parent.path) + ")";
			}
		}
		
		platform.setTitle(title);
	}
	
	async loadSession() {
		let tabsToOpen = [];
		let fileToSelect;
		
		if (platform.isMainWindow) {
			let session = await platform.loadJson("session");
			
			if (session) {
				tabsToOpen = session.tabs;
				fileToSelect = session.selectedTabPath;
			}
			
			window.addEventListener("beforeunload", () => {
				this.saveSession();
			});
		}
		
		tabsToOpen.push(...platform.getFilesToOpenOnStartup().map(function(path) {
			return {
				isNew: true,
				path,
			};
		}));
		
		this.tabs = await bluebird.map(tabsToOpen, async ({path}) => {
			return this.createTab(await platform.fs(path).read(), path);
		});
		
		for (let details of tabsToOpen) {
			if (!details.isNew) {
				this.findTabByPath(details.path).restoreState(details);
			}
		}
		
		if (this.tabs.length > 0) {
			this.selectTab(this.findTabByPath(fileToSelect) || this.tabs[this.tabs.length - 1]);
		} else {
			this.initialNewFileTab = this.newFile();
		}
	}
	
	async saveSession() {
		let tabs = this.tabs.map(function(tab) {
			return tab.path ? tab.saveState() : null;
		}).filter(Boolean);
		
		await platform.saveJson("session", {
			tabs,
			selectedTabPath: this.selectedTab?.path,
		});
	}
	
	findInFiles(path) {
		platform.findInFiles(path, () => {
			this.findInFilesInApp(path);
		});
	}
	
	findAndReplaceInFiles(path) {
		platform.findAndReplaceInFiles(path, () => {
			this.findAndReplaceInFiles(path);
		});
	}
	
	editSnippet(snippet) {
		platform.editSnippet(snippet, () => {
			this.editSnippetInApp(snippet);
		});
	}
	
	editSnippetInApp(snippet) {
		this.openModal((el, closeWindow) => {
			let snippetEditor = new base.components.SnippetEditor({
				target: el,
				
				props: {
					app: this,
					snippet,
				},
			});
			
			snippetEditor.$on("save", () => {
				console.log("save");
				
				closeWindow();
			});
		});
	}
	
	uiMounted(mainDiv) {
		this.mainDiv = mainDiv;
	}
	
	async onCloseWindow(e) {
		let modifiedTabs = this.tabs.filter(tab => tab.modified);
		
		if (modifiedTabs.length === 0) {
			return;
		}
		
		e.preventDefault();
		
		let tabNames = modifiedTabs.map(tab => tab.name).join(", ");
		
		let {response} = await platform.showMessageBox({
			message: "Save changes to " + tabNames + "?",
			buttons: ["&Yes", "&No", "&Cancel"],
		});
		
		if (response === 0) {
			for (let tab of modifiedTabs) {
				let path = await this.save(tab);
				
				if (!path) {
					return;
				}
			}
		} else if (response === 2) {
			return;
		}
		
		platform.closeWindow();
	}
	
	teardown() {
		for (let fn of this.teardownCallbacks) {
			fn();
		}
	}
}

module.exports = App;
