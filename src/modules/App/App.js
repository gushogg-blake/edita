let bluebird = require("bluebird");

let {removeInPlace, moveInPlace} = require("utils/arrayMethods");
let Evented = require("utils/Evented");
let bindFunctions = require("utils/bindFunctions");
let replaceHomeDirWithTilde = require("utils/replaceHomeDirWithTilde");
let promiseWithMethods = require("utils/promiseWithMethods");
let nextName = require("utils/nextName");

let URL = require("modules/URL");
let protocol = require("modules/protocol");
let Document = require("modules/Document");
let Editor = require("modules/Editor");
let View = require("modules/View");
let generateRequiredLangs = require("modules/utils/generateRequiredLangs");

let EditorTab = require("./EditorTab");
let Projects = require("./Projects");
let FileTree = require("./FileTree");
let Pane = require("./Pane");
let ToolsPane = require("./ToolsPane");
let OutputPane = require("./OutputPane");
let FindAndReplace = require("./FindAndReplace");
let openDialogWindow = require("./openDialogWindow");
let functions = require("./functions");
let dev = require("./dev");

class App extends Evented {
	constructor() {
		super();
		
		this.tools = new ToolsPane(this, "bottom1");
		this.output = new OutputPane(this, "bottom2");
		
		this.panes = {
			left: new Pane("left"),
			right: new Pane("right"),
			bottom1: this.tools,
			bottom2: this.output,
		};
		
		this.panes.bottom1.stackAbove(this.panes.bottom2);
		
		this.fileTree = new FileTree(this);
		
		this.findAndReplace = new FindAndReplace(this);
		
		this.tabs = [];
		this.selectedTab = null;
		this.previouslySelectedTabs = [];
		this.closedTabs = [];
		this.lastSelectedSavedUrl = null;
		
		this.projects = new Projects(this);
		
		this.functions = bindFunctions(this, functions);
		
		this.openDialogWindow = openDialogWindow(this);
		
		this.teardownCallbacks = [
			platform.on("closeWindow", this.onCloseWindow.bind(this)),
			platform.on("openFromElectronSecondInstance", this.onOpenFromElectronSecondInstance.bind(this)),
			...Object.values(this.panes).map(pane => pane.on("show hide resize", () => this.fire("updatePanes"))),
			this.on("selectTab", this.onSelectTab.bind(this)),
			this.on("document.save", this.onDocumentSave.bind(this)),
			...Object.values(this.panes).map(pane => this.relayEvents(pane, ["update"], "pane.")).flat(),
		];
	}
	
	async init() {
		await this.projects.init();
		
		await Promise.all([
			this.loadSessionAndFilesToOpenOnStartup(),
			this.fileTree.init(),
			this.findAndReplace.init(),
		]);
		
		dev(this);
	}
	
	get selectedProject() {
		return this.projects.selectedProject;
	}
	
	getCurrentDir(_default=null) {
		let lastSelectedPath = this.lastSelectedSavedUrl && platform.fs(this.lastSelectedSavedUrl.path).parent.path;
		
		return lastSelectedPath || _default;
	}
	
	get editorTabs() {
		return this.tabs.filter(tab => tab.isEditor);
	}
	
	async save(tab) {
		let {document} = tab;
		
		if (document.isSaved) {
			if (document.fileChangedWhileModified) {
				if (!await confirm(tab.name + " has changed on disk since the last save.  Overwrite current version?")) {
					return;
				}
			}
			
			await document.save();
		} else {
			let dir = this.getCurrentDir(platform.systemInfo.homeDir);
			
			let path = await platform.saveAs({
				defaultPath: platform.fs(dir, platform.fs(document.path).name).path,
			});
			
			if (path) {
				await document.saveAs(URL.file(path));
			}
		}
	}
	
	async renameTab(tab) {
		let {url} = tab;
		let oldPath = tab.path;
		
		let path = await platform.saveAs({
			defaultPath: oldPath,
		});
		
		if (path && path !== oldPath) {
			await tab.document.saveAs(URL.file(path));
			await protocol(url).delete();
		}
	}
	
	reorderTab(tab, index) {
		moveInPlace(this.tabs, tab, index);
		
		this.fire("updateTabs");
	}
	
	selectTab(tab) {
		if (this.selectedTab) {
			this.addToPreviouslySelectedTabs(this.selectedTab);
		}
		
		this.selectedTab?.hide();
		
		this.selectedTab = tab;
		
		tab.show();
		
		this.updateTitle();
		
		if (tab.isEditor) {
			this.tools.clippingsEditor.setLang(tab.editor.document.lang);
		}
		
		this.fire("selectTab", tab);
		
		this.focusSelectedTabAsync();
	}
	
	addToPreviouslySelectedTabs(tab) {
		removeInPlace(this.previouslySelectedTabs, tab);
		
		this.previouslySelectedTabs.push(tab);
		
		if (this.previouslySelectedTabs.length > 10) {
			this.previouslySelectedTabs.shift();
		}
	}
	
	focusSelectedTab() {
		this.selectedTab?.focus();
	}
	
	focusSelectedTabAsync() {
		setTimeout(() => {
			this.focusSelectedTab();
		}, 0);
	}
	
	getTabName(tab) {
		if (tab.isEditor) {
			return platform.fs(tab.path).name;
		} else if (tab.isRefactor) {
			return "Refactor";
		}
	}
	
	getTabLabel(tab) {
		return tab.name + (tab.modified ? " *" : "");
	}
	
	async closeTab(tab, noSave=false) {
		if (tab.modified) {
			let response = await platform.showMessageBox(this, {
				message: "Save changes to " + tab.name + "?",
				buttons: ["%Yes", "%No", "%Cancel"],
			});
			
			if (response === 0) {
				await this.save(tab);
				
				if (!tab.isSaved) {
					return;
				}
			} else if (response !== 1) {
				return;
			}
		}
		
		let selectNext = null;
		
		if (this.selectedTab === tab) {
			this.selectedTab = null;
			
			let prevSelected = this.previouslySelectedTabs.pop();
			
			if (prevSelected) {
				selectNext = prevSelected;
			} else {
				let index = this.tabs.indexOf(tab);
				
				if (index > 0) {
					selectNext = this.tabs[index - 1];
				} else if (index < this.tabs.length - 1) {
					selectNext = this.tabs[index + 1];
				}
			}
		}
		
		tab.teardown();
		
		removeInPlace(this.tabs, tab);
		removeInPlace(this.previouslySelectedTabs, tab);
		
		if (tab.isSaved && !noSave) {
			this.closedTabs.unshift(tab.saveState());
		}
		
		if (tab === this.initialNewFileTab) {
			this.initialNewFileTab = null;
		}
		
		if (selectNext) {
			this.selectTab(selectNext);
		} else {
			this.updateTitle();
		}
		
		this.fire("updateTabs");
		this.fire("tabClosed", tab);
	}
	
	async deleteTab(tab) {
		if (!await confirm("Delete " + tab.path + "?")) {
			return;
		}
		
		await protocol(tab.url).delete();
		
		this.closeTab(tab);
	}
	
	async closeOthers(tab) {
		for (let other of this.editorTabs.filter(t => t !== tab)) {
			await this.closeTab(other);
		}
	}
	
	urlIsOpen(url) {
		return this.editorTabs.some(tab => tab.url.toString() === url.toString());
	}
	
	pathIsOpen(path) {
		return this.editorTabs.some(tab => tab.protocol === "file" && tab.path === path);
	}
	
	showFindBar() {
		this.fire("showFindBar");
	}
	
	hideFindBar() {
		this.fire("hideFindBar");
	}
	
	hideFindBarAndFocusEditor() {
		this.hideFindBar();
		this.focusSelectedTab();
	}
	
	showFindAndReplace(options) {
		let search = "";
		
		if (this.selectedTab?.isEditor) {
			let {editor} = this.selectedTab;
			let {document} = editor;
			let selectedText = editor.getSelectedText();
			
			if (selectedText.indexOf(document.fileDetails.newline) === -1) {
				search = selectedText;
			}
		}
		
		this.fire("showFindAndReplace", {
			...this.findAndReplace.defaultOptions,
			...this.findAndReplace.savedOptions,
			search,
			...options,
		});
	}
	
	hideFindAndReplace() {
		this.fire("hideFindAndReplace");
		
		this.focusSelectedTab();
	}
	
	openPath(path, code=null) {
		return this.openFile(URL.file(path), code);
	}
	
	async openFile(url, code=null) {
		let {path} = url;
		
		if (
			this.editorTabs.length === 1
			&& this.editorTabs[0] === this.initialNewFileTab
			&& !this.initialNewFileTab.modified
		) {
			this.closeTab(this.initialNewFileTab);
		}
		
		let existingTab = this.findTabByUrl(url);
		
		if (existingTab) {
			this.selectTab(existingTab);
			
			return existingTab;
		}
		
		if (code === null) {
			code = await platform.fs(path).read();
		}
		
		let tab = await this.createEditorTab(code, url);
		
		this.tabs.splice(this.tabs.indexOf(this.selectedTab) + 1, 0, tab);
		
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
			
			await this.openPath(path, code);
		});
	}
	
	async newFile(lang=null) {
		let fileDetails = base.getDefaultFileDetails(lang);
		
		({lang} = fileDetails);
		
		let {defaultExtension} = lang;
		let extension = defaultExtension ? "." + defaultExtension : "";
		let name = nextName(n => lang.name + "-" + n + extension, name => !this.editorTabs.some(tab => tab.path.includes(name)));
		let dir = this.selectedProject?.dirs[0].path || platform.systemInfo.homeDir;
		let path = platform.fs(dir).child(name).path;
		
		let tab = await this.createEditorTab("", URL._new(path), fileDetails);
		
		this.tabs.push(tab);
		
		this.fire("updateTabs");
		
		this.selectTab(tab);
		this.focusSelectedTab();
		
		return tab;
	}
	
	async createEditorTab(code, url, fileDetails=null) {
		if (base.getPref("dev.timing.misc")) {
			console.time("createEditorTab");
		}
		
		if (!fileDetails) {
			fileDetails = base.getFileDetails(code, url);
		}
		
		if (fileDetails.hasMixedNewlines) {
			// TODO prompt to change all newlines
			
			throw "File " + url.path + " has mixed newlines";
		}
		
		await bluebird.map([...generateRequiredLangs(fileDetails.lang)], lang => base.initLang(lang));
		
		let document = this.createDocument(code, url, {
			project: await this.projects.findOrCreateProjectForUrl(url),
			fileDetails,
		});
		
		let view = new View(document);
		let editor = this._createEditor(document, view);
		let tab = new EditorTab(this, editor);
		
		editor.on("cut copy", (str) => {
			this.tools.clippingsTab.addClipping(str);
		});
		
		await tab.init();
		
		tab.on("focus", this.onTabFocus.bind(this));
		
		this.fire("tabCreated", tab);
		this.fire("editorTabCreated", tab);
		
		if (base.getPref("dev.timing.misc")) {
			console.timeEnd("createEditorTab");
		}
		
		return tab;
	}
	
	createDocument(code, url, options) {
		let document = new Document(code, url, options);
		
		for (let event of ["edit", "undo", "redo", "save", "fileChanged", "projectChanged"]) {
			document.on(event, (...args) => {
				this.updateTitle();
				
				this.fire("document." + event, document, ...args);
			});
		}
		
		return document;
	}
	
	_createEditor(document, view) {
		let editor = new Editor(document, view);
		
		editor.on("requestWordCompletionCandidates", (add) => {
			add(this.editorTabs.map(function(tab) {
				let {path} = tab;
				
				return path && platform.fs(path).basename;
			}).filter(Boolean));
		});
		
		return editor;
	}
	
	createEditor() {
		let document = new Document("");
		let view = new View(document);
		
		return this._createEditor(document, view);
	}
	
	refactor(...args) {
		return this.tools.refactor(...args);
	}
	
	findTabByPath(path) {
		return this.editorTabs.find(tab => tab.protocol === "file" && tab.path === path);
	}
	
	findTabByUrl(url) {
		return this.editorTabs.find(tab => tab.url.toString() === url.toString());
	}
	
	selectNextTab(dir) {
		if (!this.selectedTab) {
			return;
		}
		
		let {tabs} = this;
		let index = tabs.indexOf(this.selectedTab);
		let newIndex = index + dir;
		
		if (newIndex === -1) {
			newIndex = tabs.length - 1;
		}
		
		if (newIndex === tabs.length) {
			newIndex = 0;
		}
		
		this.selectTab(tabs[newIndex]);
	}
	
	onOpenFromElectronSecondInstance(files) {
		for (let path of files) {
			this.openPath(path);
		}
	}
	
	updateTitle() {
		let title = "";
		
		if (this.selectedTab) {
			title = this.getTabName(this.selectedTab);
			
			if (this.selectedTab.isSaved) {
				title += " (" + replaceHomeDirWithTilde(platform.fs(this.selectedTab.path).parent.path) + ")";
			}
		}
		
		platform.setTitle(title);
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
			
			window.addEventListener("beforeunload", () => {
				this.saveSession();
			});
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
		
		this.tabs = await bluebird.map(tabsToOpen, async ({url}) => {
			url = new URL(url);
			
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
	
	findInFiles(paths) {
		this.showFindAndReplace({
			replace: false,
			searchIn: "files",
			paths,
		});
	}
	
	replaceInFiles(paths) {
		this.showFindAndReplace({
			replace: true,
			searchIn: "files",
			paths,
		});
	}
	
	newSnippet(details={}) {
		platform.openDialogWindow(this, "snippetEditor", {
			id: null,
			details,
		}, {
			title: "New snippet",
			width: 680,
			height: 480,
		});
	}
	
	editSnippet(id) {
		platform.openDialogWindow(this, "snippetEditor", {
			id,
		}, {
			title: "Edit snippet",
			width: 680,
			height: 480,
		});
	}
	
	showMessageBox(options) {
		let promise = promiseWithMethods();
		
		this.openDialogWindow("messageBox", options, {
			width: 500,
			height: 75,
		});
		
		this.messageBoxPromise = promise;
		
		return promise;
	}
	
	messageBoxRespond(response) {
		if (this.messageBoxPromise) {
			this.messageBoxPromise.resolve(response);
		}
		
		delete this.messageBoxPromise;
	}
	
	onSelectTab(tab) {
		if (tab.isSaved) {
			this.lastSelectedSavedUrl = tab.url;
		}
	}
	
	async onDocumentSave(document) {
		if (document === this.selectedTab.document) {
			this.lastSelectedSavedUrl = document.url;
		}
		
		let project = await this.projects.findOrCreateProjectForUrl(document.url);
		
		if (project !== document.project) {
			document.setProject(project);
		}
	}
	
	onTabFocus() {
		this.hideFindBar();
	}
	
	renderDiv(div) {
		this.fire("renderDiv", div);
	}
	
	async onCloseWindow(e) {
		let modifiedTabs = this.editorTabs.filter(tab => tab.modified);
		
		if (modifiedTabs.length === 0) {
			return;
		}
		
		e.preventDefault();
		
		let tabNames = modifiedTabs.map(tab => tab.name).join(", ");
		
		let response = await platform.showMessageBox(this, {
			message: "Save changes to " + tabNames + "?",
			buttons: ["%Yes", "%No", "%Cancel"],
		});
		
		if (response === 0) {
			for (let tab of modifiedTabs) {
				await this.save(tab);
				
				if (!tab.isSaved) {
					return;
				}
			}
		} else if (response !== 1) {
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
