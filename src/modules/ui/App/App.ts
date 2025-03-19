import bluebird from "bluebird";

import {removeInPlace, moveInPlace, partition, sortedPartition} from "utils/array";
import Evented from "utils/Evented";
import bindFunctions from "utils/bindFunctions";
import promiseWithMethods from "utils/promiseWithMethods";
import nextName from "utils/nextName";
import multimatch from "utils/multimatch";

import URL from "modules/utils/URL";
import protocol from "modules/protocol";
import Document from "modules/core/Document";
import Editor from "modules/ui/Editor";
import View from "modules/ui/View";
import {alwaysIncludeDirInTabTitle} from "modules/base/conventions";

import Projects from "./Projects";
import Tools from "./Tools";
import Output from "./Output";
import FindAndReplace from "./FindAndReplace";
import showSyntheticDialog from "./showSyntheticDialog";
import functions from "./functions";
import SidePanes from "./panes/SidePanes";
import BottomPanes from "./panes/BottomPanes";
import EditorTab from "./tabs/EditorTab";
import RefactorPreviewTab from "./tabs/RefactorPreviewTab";
import FileTree from "./FileTree";

import dev from "./dev";

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
		
		this.showSyntheticDialog = showSyntheticDialog(this);
		
		if (platform.isMainWindow) {
			window.addEventListener("beforeunload", () => {
				this.saveSession();
				this.saveEphemeralUiState();
			});
		}
		
		this.teardownCallbacks = [
			platform.on("closeWindow", this.onCloseWindow.bind(this)),
			platform.on("openFromElectronSecondInstance", this.onOpenFromElectronSecondInstance.bind(this)),
			this.on("document.save", this.onDocumentSave.bind(this)),
			// update tab labels before any other handlers see updateTabs
			this.on("updateTabs", () => this.fire("updateTabLabels")),
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
		
		this.restoreEphemeralUiState();
		
		dev(this);
	}
	
	get selectedProject() {
		return this.projects.selectedProject;
	}
	
	getCurrentDir(_default=null) {
		if (this.selectedTab?.isSaved) {
			return platform.fs(this.selectedTab.path).parent.path;
		} else {
			for (let i = this.previouslySelectedTabs.length - 1; i >= 0; i--) {
				let tab = this.previouslySelectedTabs[i];
				
				if (tab.isSaved) {
					return platform.fs(tab.path).parent.path;
				}
			}
		}
		
		return this.selectedProject?.dirs[0] || this.fileTree.rootEntry.path || _default;
	}
	
	get editorTabs() {
		return this.tabs.filter(tab => tab.isEditor);
	}
	
	async _showOpenDialog(dir, mode) {
		if (!dir) {
			dir = this.getCurrentDir();
		}
		
		let {canceled, paths} = await this.dialogPromise("fileChooser", {
			path: dir,
			mode,
		});
		
		if (canceled) {
			return [];
		}
		
		return paths;
	}
	
	showOpenDialog(dir=null) {
		return this._showOpenDialog(dir, "selectFiles");
	}
	
	showChooseDirDialog(startDir=null) {
		return this._showOpenDialog(startDir, "selectDir");
	}
	
	async showSaveAsDialog(options) {
		let {canceled, path} = await this.dialogPromise("fileChooser", {
			mode: "save",
			...options,
		});
		
		return path || null;
	}
	
	async save(tab) {
		let {document} = tab;
		
		if (document.isSaved) {
			if (document.fileChangedWhileModified) {
				if (!await confirm(tab.name + " has changed on disk since the last save. Overwrite current version?")) {
					return;
				}
			}
			
			await document.save();
		} else {
			await this.saveAs(tab);
		}
	}
	
	async saveAs(tab) {
		let {document} = tab;
		
		let dir = this.getCurrentDir(platform.systemInfo.homeDir);
		
		let path = await this.showSaveAsDialog({
			path: platform.fs(dir, platform.fs(document.path).name).path,
		});
		
		if (path) {
			await document.saveAs(URL.file(path));
		}
	}
	
	async saveAll() {
		let [saved, unsaved] = partition(this.tabs, tab => tab.isSaved);
		
		await Promise.all([
			bluebird.map(saved, tab => this.save(tab)),
			bluebird.each(unsaved, tab => this.saveAs(tab)),
		]);
	}
	
	async renameTab(tab) {
		let {url} = tab;
		let oldPath = tab.path;
		
		let path = await platform.saveAs({
			path: oldPath,
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
			this.output.clippingsTab?.setLang(tab.editor.document.lang);
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
	
	focus() {
		setTimeout(() => {
			this.fire("requestFocus");
		}, 0);
	}
	
	focusSelectedTab() {
		this.selectedTab?.focus();
	}
	
	focusSelectedTabAsync() {
		setTimeout(() => {
			this.focusSelectedTab();
		}, 0);
	}
	
	getEditorTabLabel(tab) {
		let sep = platform.systemInfo.pathSeparator;
		let node = platform.fs(tab.path);
		let {name, basename, extension} = node;
		let shortenedName = name;
		let prefixWithParentByConvention = "";
		
		// shorten
		
		if (basename.length > 20) {
			shortenedName = basename.substr(0, 8).trim() + "..." + basename.substr(-8).trim() + extension;
		}
		
		// conventions - always include dir for generic names like index.js
		
		if (multimatch(alwaysIncludeDirInTabTitle, node.name)) {
			prefixWithParentByConvention = node.parent.name + sep;
		}
		
		/*
		disambiguation
		
		start with the filename and for all tabs with same filename,
		step back until we find an ancestor dir that's different
		
		then, if we just stepped back one dir just prepend it
		
		otherwise, prepend the dir, /.../, then the filename (the dots
		representing path parts that are the same between tabs)
		*/
		
		if (node.parent.isRoot) {
			return shortenedName;
		}
		
		let others = this.editorTabs.map(other => platform.fs(other.path)).filter(function(other) {
			return (
				other.path !== node.path
				&& other.name === node.name
			);
		});
		
		if (others.length === 0) {
			return {
				label: prefixWithParentByConvention + shortenedName,
			};
		}
		
		let startNode = node;
		
		do {
			startNode = startNode.parent;
			others = others.map(other => other.parent);
		} while (others.some(other => other.name === startNode.name));
		
		if (startNode.isRoot) {
			/*
			other tabs' paths are our full path with a prefix -
			handle this case specially to avoid disambiguating it
			as //.../filename
			*/
			
			return {
				label: prefixWithParentByConvention + shortenedName,
			};
		}
		
		let disambiguator = "";
		
		if (startNode.path === node.parent.path) {
			disambiguator = prefixWithParentByConvention ? "" : startNode.name + sep;
		} else {
			disambiguator = startNode.name + sep + "..." + sep;
		}
		
		return {
			label: prefixWithParentByConvention + shortenedName,
			disambiguator,
		};
	}
	
	async closeTab(tab, noSave=false) {
		if (tab.modified) {
			let response = await this.showMessageBox({
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
		}
		
		if (!selectNext) {
			this.updateTitle();
			this.focus();
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
	
	showQuickAction(type) {
		
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
		
		let tab = await this.createEditorTab("\n", URL._new(path), format);
		
		this.tabs.push(tab);
		
		this.fire("updateTabs");
		
		this.selectTab(tab);
		this.focusSelectedTab();
		
		return tab;
	}
	
	async openLangSelector() {
		this.fire("openLangSelector");
	}
	
	async createEditorTab(code, url, format=null) {
		if (base.getPref("dev.timing.misc")) {
			console.time("createEditorTab");
		}
		
		if (!format) {
			format = base.getFormat(code, url);
		}
		
		let newlinesNormalised = false;
		
		if (format.hasMixedNewlines) {
			let {newline} = platform.systemInfo;
			let displayNewline = newline.replace("\n", "\\n").replace("\r", "\\r");
			
			alert("Warning: normalising mixed newlines to " + displayNewline + " to edit " + url.path);
			
			code = code.replaceAll("\r\n", newline);
			code = code.replaceAll("\r", newline);
			code = code.replaceAll("\n", newline);
			
			format.hasMixedNewlines = false;
			format.newline = newline;
			
			newlinesNormalised = true;
		}
		
		await base.ensureRequiredLangsInitialised(format.lang);
		
		let document = this.createDocument(code, url, {
			project: await this.projects.findOrCreateProjectForUrl(url),
			format,
			newlinesNormalised,
		});
		
		let view = new View(document);
		let editor = this._createEditor(document, view);
		let tab = new EditorTab(this, editor);
		
		editor.on("cut copy", (str) => {
			this.output.clippingsTab?.addClipping(str);
		});
		
		editor.on("normalSelectionChangedByMouseOrKeyboard", () => this.showAstHint(editor));
		
		editor.on("requestGoToDefinition", async ({path, selection}) => {
			let tab = await this.openPath(path);
			let {api} = tab.editor;
			
			api.setNormalHilites([selection], 700);
			api.centerSelection(selection);
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
	
	async findReferencesToFile(tab) {
		// TODO not implemented by LSP yet
		// see https://github.com/microsoft/language-server-protocol/issues/2047
	}
	
	showAstHint(editor) {
		if (!base.getPref("dev.showAstHints")) {
			return;
		}
		
		let cursor = editor.normalSelection.left;
		let node = editor.document.getNodeAtCursor(cursor);
		
		if (!node) {
			return;
		}
		
		let lineage = node.lineage().slice(1);
		
		let [notOnLine, onLine] = sortedPartition(lineage, n => n.start.lineIndex !== cursor.lineIndex);
		
		this.fire("showAstHint", {
			all: lineage,
			notOnLine,
			onLine,
		});
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
	
	dialogPromise(name, options) {
		return platform.dialogPromise(this.showSyntheticDialog, name, options);
	}
	
	openDialogWindow(name, options) {
		platform.openDialogWindow(this.showSyntheticDialog, name, options);
	}
	
	newSnippet(details={}) {
		this.openDialogWindow("snippetEditor", {
			id: null,
			details,
		}, {
			title: "New snippet",
			width: 680,
			height: 480,
		});
	}
	
	editSnippet(id) {
		this.openDialogWindow("snippetEditor", {
			id,
		}, {
			title: "Edit snippet",
			width: 680,
			height: 480,
		});
	}
	
	showMessageBox(options) {
		return this.dialogPromise("messageBox", options, {
			width: 500,
			height: 75,
		});
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
		
		let response = await this.showMessageBox({
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

export default App;
