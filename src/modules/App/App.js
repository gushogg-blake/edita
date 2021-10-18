let bluebird = require("bluebird");

let {remove, moveInPlace} = require("utils/arrayMethods");
let Evented = require("utils/Evented");
let bindFunctions = require("utils/bindFunctions");
let replaceHomeDirWithTilde = require("utils/replaceHomeDirWithTilde");
let inlineStyle = require("utils/dom/inlineStyle");
let {on, off} = require("utils/dom/domEvents");
let windowFocus = require("utils/dom/windowFocus");

let Document = require("modules/Document");
let Tab = require("modules/Tab");
let Editor = require("modules/Editor");
let View = require("modules/View");

let FileTree = require("./FileTree");
let BottomPane = require("./BottomPane");
let FindAndReplace = require("./FindAndReplace");
let createDialogComponent = require("./createDialogComponent");
let functions = require("./functions");

class App extends Evented {
	constructor() {
		super();
		
		this.fileTree = new FileTree(this);
		this.bottomPane = new BottomPane(this);
		
		this.findAndReplace = new FindAndReplace(this);
		
		this.tabs = [];
		this.selectedTab = null;
		this.closedTabs = [];
		this.lastSelectedPath = null;
		
		this.panes = platform.getPref("panes");
		
		this.createDialogComponent = bindFunctions(this, createDialogComponent);
		this.functions = bindFunctions(this, functions);
		
		this.teardownCallbacks = [
			platform.on("closeWindow", this.onCloseWindow.bind(this)),
			platform.on("openFromElectronSecondInstance", this.onOpenFromElectronSecondInstance.bind(this)),
			windowFocus.listen(this.onWindowFocusChanged.bind(this)),
		];
		
		platform.handleIpcMessages("findAndReplace", this.findAndReplace);
		
		// DEV
		setInterval(() => {
			if (platform.getPref("dev.showFocusedElement")) {
				console.log(this.selectedTab.editor.view.focused);
				console.log(document.activeElement);
			}
		}, 1000);
	}
	
	async init() {
		await Promise.all([
			this.loadSessionAndFilesToOpenOnStartup(),
			this.fileTree.init(),
		]);
	}
	
	async save(tab) {
		let {document} = tab.editor;
		
		if (tab.path) {
			await document.save();
		} else {
			let dir = platform.systemInfo.homeDir;
			
			if (this.lastSelectedPath) {
				dir = platform.fs(this.lastSelectedPath).parent.path;
			}
			
			let path = await platform.saveAs({
				defaultPath: dir,
			});
			
			if (path) {
				await document.saveAs(path);
			}
		}
		
		return tab.path;
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
		
		this.updateTitle();
		
		if (tab.path) {
			this.lastSelectedPath = tab.path;
		}
		
		this.fire("selectTab");
		
		this.focusSelectedTabAsync();
	}
	
	focusSelectedTabAsync() {
		setTimeout(() => {
			this.selectedTab?.editor.view.requestFocus();
		}, 0);
	}
	
	onWindowFocusChanged(isFocused) {
		if (isFocused) {
			this.focusSelectedTabAsync();
		}
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
			let response = await platform.showMessageBox({
				message: "Save changes to " + tab.name + "?",
				buttons: ["%Yes", "%No", "%Cancel"],
			});
			
			if (response === 0) {
				let path = await this.save(tab);
				
				if (!path) {
					return;
				}
			} else if (response !== 1) {
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
	
	async deleteTab(tab) {
		if (!await platform.confirm("Delete " + tab.path + "?")) {
			return;
		}
		
		await platform.fs(tab.path).delete();
		
		this.closeTab(tab);
	}
	
	pathIsOpen(path) {
		return this.tabs.some(tab => tab.path === path);
	}
	
	showPane(name) {
		this.setPaneVisibility(name, true);
	}
	
	hidePane(name) {
		this.setPaneVisibility(name, false);
	}
	
	togglePane(name) {
		this.setPaneVisibility(name, !this.panes[name].show);
	}
	
	setPaneVisibility(name, visible) {
		this.panes[name].show = visible;
		
		platform.setPref("panes." + name + ".show", visible);
		
		this.fire("updatePanes");
	}
	
	resizePane(name, size) {
		this.panes[name].size = size;
		
		this.fire("updatePanes");
	}
	
	savePaneSize(name) {
		platform.setPref("panes." + name + ".size", this.panes[name].size);
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
		
		let tab = await this.createTab(code, path);
		
		this.tabs.push(tab);
		
		this.fire("updateTabs");
		
		this.selectTab(tab);
		
		return tab;
	}
	
	async openFilesFromUpload(files) {
		await bluebird.map(files, async ({name, code}) => {
			let path = "/" + name;
			let node = platform.fs(path);
			
			if (await node.exists()) {
				await node.rename(node.basename + "-" + Date.now() + node.extension);
			}
			
			await node.write(code);
			
			await this.openFile(path, code);
		});
	}
	
	async newFile() {
		let tab = await this.createTab("", null);
		
		this.tabs.push(tab);
		
		this.fire("updateTabs");
		
		this.selectTab(tab);
		
		return tab;
	}
	
	async createTab(code, path) {
		let document = this.createDocument(code, path);
		let view = new View(document);
		let editor = new Editor(document, view);
		let tab = new Tab(this, editor);
		
		await tab.init();
		
		tab.on("focus", this.onTabFocus.bind(this));
		
		return tab;
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
		let view = new View(document);
		
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
	
	async loadSessionAndFilesToOpenOnStartup() {
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
			try {
				return this.createTab(await platform.fs(path).read(), path);
			} catch (e) {
				console.error(e);
				
				return null;
			}
		}).filter(Boolean);
		
		for (let details of tabsToOpen) {
			if (!details.isNew) {
				this.findTabByPath(details.path)?.restoreState(details);
			}
		}
		
		if (this.tabs.length > 0) {
			this.selectTab(this.findTabByPath(fileToSelect) || this.tabs[this.tabs.length - 1]);
		} else {
			this.initialNewFileTab = await this.newFile();
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
	
	findInFiles(paths) {
		this.showFindDialog({
			replace: false,
			searchIn: "files",
			paths,
		});
	}
	
	replaceInFiles(paths) {
		this.showFindDialog({
			replace: true,
			searchIn: "files",
			paths,
		});
	}
	
	async showFindDialog(options) {
		let search = "";
		
		if (this.selectedTab) {
			let {editor} = this.selectedTab;
			let {document} = editor;
			let selectedText = editor.getSelectedText();
			
			if (selectedText.indexOf(document.fileDetails.newline) === -1) {
				search = selectedText;
			}
		}
		
		platform.openDialogWindow(this, "findAndReplace", {
			...await this.findAndReplace.loadOptions(),
			search,
			...options,
		}, {
			width: 640,
			height: 300,
		});
	}
	
	newSnippet(details={}) {
		platform.openDialogWindow(this, "snippetEditor", {
			id: null,
			details,
		}, {
			width: 680,
			height: 480,
		});
	}
	
	editSnippet(id) {
		platform.openDialogWindow(this, "snippetEditor", {
			id,
		}, {
			width: 680,
			height: 480,
		});
	}
	
	async openDialogWindow(dialog, dialogOptions, windowOptions) {
		let overlay = document.createElement("div");
		let container = document.createElement("div");
		
		overlay.className = "editor";
		
		document.body.appendChild(overlay);
		overlay.appendChild(container);
		
		overlay.style = inlineStyle({
			position: "fixed",
			zIndex: 100,
			display: "flex",
			justifyContent: "center",
			alignItems: "center",
			top: 0,
			right: 0,
			bottom: 0,
			left: 0,
			//background: "#00000020",
		});
		
		let {
			width,
			height,
		} = windowOptions;
		
		container.style = inlineStyle({
			width,
			height,
			border: "1px solid gray",
			background: "white",
		});
		
		let close = () => {
			overlay.parentNode.removeChild(overlay);
			
			this.focusSelectedTabAsync();
			
			off(overlay, "mousedown", close);
			off(window, "keydown", keydown);
		}
		
		function keydown(e) {
			if (e.key === "Escape") {
				e.preventDefault();
				
				close();
				
				return;
			}
		}
		
		on(container, "mousedown", function(e) {
			e.stopPropagation();
		});
		
		on(container, "keydown", function(e) {
			e.stopPropagation();
		});
		
		on(overlay, "mousedown", close);
		on(window, "keydown", keydown);
		
		await this.createDialogComponent[dialog](container, dialogOptions, close);
		
		function resize() {
			
		}
	}
	
	onTabFocus() {
		this.hideFindBar();
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
		
		let response = await platform.showMessageBox({
			message: "Save changes to " + tabNames + "?",
			buttons: ["%Yes", "%No", "%Cancel"],
		});
		
		if (response === 0) {
			for (let tab of modifiedTabs) {
				let path = await this.save(tab);
				
				if (!path) {
					return;
				}
			}
		} else if (response !== 2) {
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
