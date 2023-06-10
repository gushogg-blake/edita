let bluebird = require("bluebird");

let {removeInPlace, moveInPlace} = require("utils/arrayMethods");
let Evented = require("utils/Evented");
let bindFunctions = require("utils/bindFunctions");
let promiseWithMethods = require("utils/promiseWithMethods");
let nextName = require("utils/nextName");

let URL = require("modules/URL");
let protocol = require("modules/protocol");
let Document = require("modules/Document");
let Editor = require("modules/Editor");
let View = require("modules/View");

let EditorTab = require("./EditorTab");
let RefactorPreviewTab = require("./RefactorPreviewTab");
let Projects = require("./Projects");
let FileTree = require("./FileTree");
let Tools = require("./Tools");
let Output = require("./Output");
let SidePanes = require("./SidePanes");
let BottomPanes = require("./BottomPanes");
let FindAndReplace = require("./FindAndReplace");
let openDialogWindow = require("./openDialogWindow");
let functions = require("./functions");
let dev = require("./dev");

class App extends Evented {
	constructor() {
		super();
		
		this.findAndReplace = new FindAndReplace(this);
		
		this.bottomPanes = new BottomPanes(this);
		this.sidePanes = new SidePanes(this);
		
		this.panes = {
			left: this.sidePanes.left,
			right: this.sidePanes.right,
			tools: this.bottomPanes.tools,
			output: this.bottomPanes.output,
		};
		
		this.tools = new Tools(this);
		this.output = new Output(this);
		
		this.bottomPanes.init();
		
		this.fileTree = new FileTree(this);
		
		this.tabs = [];
		this.selectedTab = null;
		this.previouslySelectedTabs = [];
		this.closedTabs = [];
		
		this.projects = new Projects(this);
		
		this.functions = bindFunctions(this, functions);
		
		this.openDialogWindow = openDialogWindow(this);
		
		this.teardownCallbacks = [
			platform.on("closeWindow", this.onCloseWindow.bind(this)),
			platform.on("openFromElectronSecondInstance", this.onOpenFromElectronSecondInstance.bind(this)),
			this.on("document.save", this.onDocumentSave.bind(this)),
			...[this.panes.left, this.panes.right, this.bottomPanes].map(pane => this.relayEvents(pane, ["update"], "pane.")).flat(),
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
		if (this.selectedTab?.isSaved) {
			return platform.fs(this.selectedTab.path).parent.path;
		}
		
		return this.selectedProject?.dirs[0] || this.fileTree.rootEntry.path || _default;
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
		
		tab.select();
		tab.show();
		
		this.updateTitle();
		
		if (tab.isEditor) {
			this.output.clippingsEditor.setLang(tab.editor.document.lang);
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
		return platform.fs(tab.path).name;
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
		
		removeInPlace(this.previouslySelectedTabs, tab);
		
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
		return this.editorTabs.some(tab => tab.isFile && tab.path === path);
	}
	
	showFindBar() {
		this.fire("showFindBar");
		this.fire("resize");
	}
	
	hideFindBar() {
		this.fire("hideFindBar");
		this.fire("resize");
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
			
			if (selectedText.indexOf(document.format.newline) === -1) {
				search = selectedText;
			}
		}
		
		this.tools.findAndReplace({
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
	
	async readFileForOpen(path) {
		try {
			return await platform.fs(path).read();
		} catch (e) {
			if (e instanceof platform.fs.FileIsBinary) {
				alert("Opening binary files not supported: " + path);
			} else if (e.code === "EACCES") {
				alert("Could not read " + path + " (permission denied)");
			} else {
				console.log("Error reading file " + path);
				console.error(e);
				
				alert("Error occurred while opening file: " + path + " - see console for more details");
			}
			
			return null;
		}
	}
	
	async readFilesForOpen(paths) {
		let permissionsErrors = [];
		let binaryFiles = [];
		let otherErrors = false;
		
		let files = await bluebird.map(paths, async function(path) {
			try {
				return {
					path,
					code: await platform.fs(path).read(),
				};
			} catch (e) {
				if (e instanceof platform.fs.FileIsBinary) {
					binaryFiles.push(path);
				} else if (e.code === "EACCES") {
					permissionsErrors.push(path);
				} else {
					console.log("Error reading file " + path);
					console.error(e);
					
					otherErrors = true;
				}
				
				return null;
			}
		}).filter(Boolean);
		
		if (permissionsErrors.length > 0) {
			alert("Could not read the following files (permission denied):\n\n" + permissionsErrors.join("\n"));
		}
		
		if (binaryFiles.length > 0) {
			alert("Opening binary files not supported:\n\n" + binaryFiles.join("\n"));
		}
		
		if (otherErrors) {
			alert("Error occurred while opening files - see console for more details");
		}
		
		return files;
	}
	
	openPath(path, code=null) {
		return this.openFile(URL.file(path), code);
	}
	
	async openFile(url, code=null) {
		let {path} = url;
		
		let closeInitialNewFileTab = (
			this.editorTabs.length === 1
			&& this.editorTabs[0] === this.initialNewFileTab
			&& !this.initialNewFileTab.modified
		);
		
		let existingTab = this.findTabByUrl(url);
		
		if (existingTab) {
			this.selectTab(existingTab);
			
			return existingTab;
		}
		
		if (code === null) {
			code = await this.readFileForOpen(path);
			
			if (code === null) {
				return;
			}
		}
		
		if (closeInitialNewFileTab) {
			this.closeTab(this.initialNewFileTab);
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
		let format = base.getDefaultFormat(lang);
		
		({lang} = format);
		
		let {defaultExtension} = lang;
		let extension = defaultExtension ? "." + defaultExtension : "";
		let name = nextName(n => lang.name + "-" + n + extension, name => !this.editorTabs.some(tab => tab.path.includes(name)));
		let dir = this.selectedProject?.dirs[0].path || platform.systemInfo.homeDir;
		let path = platform.fs(dir).child(name).path;
		
		let tab = await this.createEditorTab("", URL._new(path), format);
		
		this.tabs.push(tab);
		
		this.fire("updateTabs");
		
		this.selectTab(tab);
		this.focusSelectedTab();
		
		return tab;
	}
	
	async createEditorTab(code, url, format=null) {
		if (base.getPref("dev.timing.misc")) {
			console.time("createEditorTab");
		}
		
		if (!format) {
			format = base.getFormat(code, url);
		}
		
		if (format.hasMixedNewlines) {
			// TODO prompt to change all newlines
			
			throw new Error("File " + url.path + " has mixed newlines");
		}
		
		await base.ensureRequiredLangsInitialised(format.lang);
		
		let document = this.createDocument(code, url, {
			project: await this.projects.findOrCreateProjectForUrl(url),
			format,
		});
		
		let view = new View(document);
		let editor = this._createEditor(document, view);
		let tab = new EditorTab(this, editor);
		
		editor.on("cut copy", (str) => {
			this.output.clippingsTab.addClipping(str);
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
	
	openRefactorPreviewTab(refactorPreview) {
		let tab = new RefactorPreviewTab(this, refactorPreview);
		
		this.tabs.splice(this.tabs.indexOf(this.selectedTab) + 1, 0, tab);
		
		this.fire("updateTabs");
		
		this.selectTab(tab);
		
		return tab;
	}
	
	findTabByPath(path) {
		return this.editorTabs.find(tab => tab.isFile && tab.path === path);
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
		platform.setTitle(this.selectedTab?.windowTitle || "");
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
	
	async onDocumentSave(document) {
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
	
	resize() {
		this.fire("resize");
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
