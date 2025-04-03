import bluebird from "bluebird";
import {Evented, moveInPlace, removeInPlace} from "utils";
import {type Lang} from "core";
import type {Resource, URL, File} from "core/resource";
import EditorTab from "ui/App/tabs/EditorTab";
import type Tab from "ui/App/tabs/Tab";
import type App from "ui/App";
import type {TabDescriptor} from "ui/App/SessionSaving";
import {getEditorTabLabel, nextNewFileName} from "./utils";

/*
the main tabs (editors, and possibly others like RefactorPreview if that
gets done)
*/

export default class extends Evented<{
	update: void;
	select: Tab;
	tabCreated: Tab;
	tabClosed: Tab;
	editorTabCreated: EditorTab;
}> {
	tabs: Tab[] = [];
	selectedTab: Tab | null = null;
	previouslySelectedTabs: Tab[] = [];
	
	private app: App;
	private closedTabs: Tab[] = [];
	private initialNewFileTab?: EditorTab;
	
	constructor(app: App) {
		super();
		
		this.app = app;
	}
	
	get editorTabs(): EditorTab[] {
		return this.tabs.filter(tab => tab instanceof EditorTab);
	}
	
	async newFile(resource): Promise<EditorTab> {
		let tab = await this.createEditorTab(resource);
		
		this.tabs.push(tab);
		
		this.fire("update");
		
		return tab;
	}
	
	async openFile(file: File): Promise<EditorTab> {
		let closeInitialNewFileTab = (
			this.editorTabs.length === 1
			&& this.editorTabs[0] === this.initialNewFileTab
			&& !this.initialNewFileTab.modified
		);
		
		if (closeInitialNewFileTab) {
			this.closeTab(this.initialNewFileTab);
		}
		
		let tab = await this.createEditorTab(file);
		
		this.tabs.splice(this.tabs.indexOf(this.selectedTab) + 1, 0, tab);
		
		this.fire("update");
		
		this.selectTab(tab);
		
		return tab;
	}
	
	selectTab(tab: Tab): void {
		if (this.selectedTab) {
			this.addToPreviouslySelectedTabs(this.selectedTab);
		}
		
		this.selectedTab?.hide();
		
		this.selectedTab = tab;
		
		tab.select();
		tab.show();
		
		this.app.updateTitle();
		
		if (tab instanceof EditorTab) {
			this.app.output.clippingsTab?.setLang(tab.editor.document.lang);
		}
		
		this.fire("select", tab);
		
		this.focusSelectedTabAsync();
	}
	
	selectNextTab(dir: number): void {
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
	
	addToPreviouslySelectedTabs(tab: Tab): void {
		removeInPlace(this.previouslySelectedTabs, tab);
		
		this.previouslySelectedTabs.push(tab);
		
		if (this.previouslySelectedTabs.length > 10) {
			this.previouslySelectedTabs.shift();
		}
	}
	
	reorderTab(tab: Tab, index: number): void {
		moveInPlace(this.tabs, tab, index);
		
		this.fire("update");
	}
	
	async closeTab(tab: Tab, noSave: boolean = false): Promise<void> {
		if (tab.modified) {
			let response = await this.app.dialogs.showMessageBox({
				message: "Save changes to " + tab.name + "?",
				buttons: ["%Yes", "%No", "%Cancel"],
			});
			
			if (response === 0) {
				await this.app.fileOperations.save(tab as EditorTab);
				
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
			this.app.updateTitle();
			this.app.focus();
		}
		
		this.fire("update");
		this.fire("tabClosed", tab);
	}
	
	async closeOthers(tab: Tab): Promise<void> {
		for (let other of this.editorTabs.filter(t => t !== tab)) {
			await this.closeTab(other);
		}
	}
	
	async createEditorTab(resource: Resource): Promise<EditorTab> {
		if (base.getPref("dev.timing.misc")) {
			console.time("createEditorTab");
		}
		
		let document = this.app.createDocument(resource);
		let editor = this.app._createEditor(document);
		
		document.setupWatch();
		
		editor.on("normalSelectionChangedByMouseOrKeyboard", () => {
			this.app.dev.showAstHint(editor);
		});
		
		// MIGRATE
		//editor.on("requestGoToDefinition", async ({path, selection}) => {
		//	let tab = await this.app.fileOperations.openPath(path);
		//	let {api} = tab.editor;
		//	
		//	api.setNormalHilites([selection], 700);
		//	api.centerSelection(selection);
		//});
		
		let tab = new EditorTab(this.app, editor);
		
		await tab.init();
		
		tab.on("focus", this.onTabFocus.bind(this));
		
		this.fire("tabCreated", tab);
		this.fire("editorTabCreated", tab);
		
		if (base.getPref("dev.timing.misc")) {
			console.timeEnd("createEditorTab");
		}
		
		return tab;
	}
	
	findTabByPath(path: string): EditorTab | undefined {
		return this.editorTabs.find(tab => tab.isSaved && tab.path === path);
	}
	
	findTabByUrl(url: URL): EditorTab | undefined {
		return this.editorTabs.find(tab => tab.url.toString() === url.toString());
	}
	
	async loadFromSessionAndStartup({tabs, urlToSelect}: {tabs: TabDescriptor[], urlToSelect?: URL}): Promise<void> {
		this.tabs = await bluebird.map(tabs, async ({file, state}) => {
			let tab = await this.createEditorTab(file);
			
			if (state) {
				tab.restoreState(state);
			}
			
			return tab;
		});
		
		if (this.editorTabs.length > 0) {
			this.selectTab(urlToSelect ? this.findTabByUrl(urlToSelect) : this.editorTabs.at(-1));
		} else {
			this.initialNewFileTab = await this.app.fileOperations.newFile();
		}
		
		this.fire("update");
	}
	
	// MIGRATE
	openRefactorPreviewTab(refactorPreview) {
		//let tab = new RefactorPreviewTab(this, refactorPreview);
		//
		//this.tabs.splice(this.tabs.indexOf(this.selectedTab) + 1, 0, tab);
		//
		//this.fire("update");
		//
		//this.selectTab(tab);
		//
		//return tab;
	}
	
	saveSession() { // TYPE
		let tabs = this.editorTabs.map(function(tab) {
			return tab.isSaved ? tab.saveState() : null;
		}).filter(Boolean);
		
		return {
			tabs,
			selectedTabUrl: this.selectedTab?.url.toString(),
		};
	}
	
	focusSelectedTab(): void {
		this.selectedTab?.focus();
	}
	
	focusSelectedTabAsync(): void {
		setTimeout(() => {
			this.focusSelectedTab();
		}, 0);
	}
	
	onTabFocus(): void {
		this.app.hideFindBar();
	}
	
	getEditorTabLabel(tab: EditorTab): string {
		return getEditorTabLabel(tab, this.editorTabs);
	}
	
	nextNewFileName(dir: string, lang: Lang): URL {
		return nextNewFileName(this.editorTabs, dir, lang);
	}
}
