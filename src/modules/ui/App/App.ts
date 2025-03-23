import bluebird from "bluebird";

import Evented from "utils/Evented";
import bindFunctions from "utils/bindFunctions";
import promiseWithMethods from "utils/promiseWithMethods";

import URL from "modules/core/resource/URL";
import Document from "modules/core/Document";
import Editor from "modules/ui/Editor";
import View from "modules/ui/View";
import {alwaysIncludeDirInTabTitle} from "modules/base/conventions";

import Projects from "modules/ui/App/Projects";
import Tools from "modules/ui/App/Tools";
import Output from "modules/ui/App/Output";
import FindAndReplace from "modules/ui/App/FindAndReplace";
import SidePanes from "modules/ui/App/panes/SidePanes";
import BottomPanes from "modules/ui/App/panes/BottomPanes";
import EditorTab from "modules/ui/App/tabs/EditorTab";
import RefactorPreviewTab from "modules/ui/App/tabs/RefactorPreviewTab";
import FileTree from "modules/ui/App/FileTree";

import commands from "./commands";
import MainTabs from "./MainTabs";
import SessionSaving from "./SessionSaving";
import FileOperations from "./FileOperations";
import Dialogs from "./Dialogs";
import contextMenu from "./contextMenu";

import readFiles from "./readFiles";

import Dev from "modules/ui/App/Dev";

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
		
		this.mainTabs = new MainTabs(this);
		this.fileTree = new FileTree(this);
		this.projects = new Projects(this);
		
		this.commands = bindFunctions(this, commands);
		
		this.dialogs = new Dialogs(this);
		this.fileOperations = new FileOperations(this);
		this.sessionSaving = new SessionSaving(this);
		
		if (platform.isMainWindow) {
			window.addEventListener("beforeunload", () => {
				this.sessionSaving.saveSession();
				this.sessionSaving.saveEphemeralUiState();
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
			this.sessionSaving.loadSessionAndFilesToOpenOnStartup(),
			this.fileTree.init(),
			this.findAndReplace.init(),
		]);
		
		this.sessionSaving.restoreEphemeralUiState();
		
		this.dev = new Dev(this);
	}
	
	get selectedProject() {
		return this.projects.selectedProject;
	}
	
	async readFiles(urls) {
		return await readFiles(urls);
	}
	
	async readFilesByUrl(urls) {
		return await readFiles(urls, true);
	}
	
	async readFile(url) {
		return (await readFiles([url]))[0] || null;
	}
	
	getCurrentDir(_default=null) {
		let {selectedTab, previouslySelectedTabs} = this.mainTabs;
		
		if (selectedTab?.isSaved) {
			return platform.fs(selectedTab.path).parent.path;
		} else {
			for (let i = previouslySelectedTabs.length - 1; i >= 0; i--) {
				let tab = previouslySelectedTabs[i];
				
				if (tab.isSaved) {
					return platform.fs(tab.path).parent.path;
				}
			}
		}
		
		return this.selectedProject?.dirs[0] || this.fileTree.rootEntry.path || _default;
	}
	
	get editorTabs() {
		return this.mainTabs.editorTabs;
	}
	
	getEditorTabLabel(tab) {
		return this.mainTabs.getEditorTabLabel(tab);
	}
	
	focus() {
		setTimeout(() => {
			this.fire("requestFocus");
		}, 0);
	}
	
	focusSelectedTab() {
		this.mainTabs.focusSelectedTab();
	}
	
	focusSelectedTabAsync() {
		this.mainTabs.focusSelectedTabAsync();
	}
	
	urlIsOpen(url) {
		return this.editorTabs.some(tab => tab.url.toString() === url.toString());
	}
	
	pathIsOpen(path) {
		return this.editorTabs.some(tab => tab.isSaved && tab.path === path);
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
	
	showQuickAction(type) {
		
	}
	
	async openLangSelector() {
		this.fire("openLangSelector");
	}
	
	createDocument(resource, options) {
		let document = new Document(resource, options);
		
		for (let event of ["edit", "undo", "redo", "save", "projectChanged"]) {
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
		let document = Document.fromString("");
		let view = new View(document);
		
		return this._createEditor(document, view);
	}
	
	// REFACTOR
	async findReferencesToFile(tab) {
		// TODO not implemented by LSP yet
		// see https://github.com/microsoft/language-server-protocol/issues/2047
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
		return this.mainTabs.findTabByPath(path);
	}
	
	findTabByUrl(url) {
		return this.mainTabs.findTabByUrl(url);
	}
	
	onOpenFromElectronSecondInstance(paths) {
		for (let path of paths) {
			this.fileOperations.openPath(path);
		}
	}
	
	updateTitle() {
		platform.setTitle(this.mainTabs.selectedTab?.windowTitle || "");
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
	
	async onDocumentSave(document) {
		let project = await this.projects.findOrCreateProjectForUrl(document.url);
		
		if (project !== document.project) {
			document.setProject(project);
		}
	}
	
	renderDiv(div) {
		this.fire("renderDiv", div);
	}
	
	showContextMenu(items, coords, options) {
		contextMenu(this, items, coords, options);
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
		
		let response = await this.dialogs.showMessageBox({
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
