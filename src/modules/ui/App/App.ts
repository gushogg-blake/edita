import bluebird from "bluebird";

import {removeInPlace, moveInPlace, partition, sortedPartition} from "utils/array";
import Evented from "utils/Evented";
import bindFunctions from "utils/bindFunctions";
import promiseWithMethods from "utils/promiseWithMethods";
import nextName from "utils/nextName";
import multimatch from "utils/multimatch";

import URL from "modules/core/resources/URL";
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

import {readFileForOpen} from "modules/ui/App/utils/readFilesForOpen";

import keyboardCommands from "./keyboardCommands";
import MainTabs from "./MainTabs";
import SessionSaving from "./SessionSaving";
import FileOperations from "./FileOperations";
import Dialogs from "./Dialogs";

import dev from "modules/ui/App/dev";

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
		
		this.keyboardCommands = bindFunctions(this, keyboardCommands);
		
		this.dialogs = new Dialogs(this);
		this.fileOperations = new FileOperations(this);
		this.sessionSaving = new SessionSaving(this);
		this.tabMgmt = new TabMgmt(this);
		
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
	
	async openLangSelector() {
		this.fire("openLangSelector");
	}
	
	createDocument(resource, options) {
		let document = new Document(resource, options);
		
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
	
	onOpenFromElectronSecondInstance(files) {
		for (let path of files) {
			this.openPath(path);
		}
	}
	
	updateTitle() {
		platform.setTitle(this.selectedTab?.windowTitle || "");
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
