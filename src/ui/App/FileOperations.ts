import {lid, partition} from "utils";
import {URL, type Lang} from "core";
import {File, NewFile} from "core/resource";
import type App from "ui/App";
import type EditorTab from "ui/App/tabs/EditorTab";

export default class {
	app: App;
	
	constructor(app: App) {
		this.app = app;
	}
	
	async newFile(lang: Lang = base.getDefaultLang()): EditorTab {
		let {mainTabs} = this.app;
		
		let dir = this.app.selectedProject?.dirs[0].path || platform.systemInfo.homeDir;
		let url = mainTabs.nextNewFileName(dir, lang);
		let resource = await NewFile.create(url);
		let tab = await mainTabs.newFile(resource);
		
		this.app.mainTabs.selectTab(tab);
		this.app.focusSelectedTab();
		
		return tab;
	}
	
	private async openFile(file: File): EditorTab {
		return await this.app.mainTabs.openFile(file);
	}
	
	openPath(path: string): Promise<EditorTab> {
		return this.openUrl(URL.file(path));
	}
	
	async openUrl(url: URL): Promise<EditorTab> {
		let {mainTabs} = this.app;
		
		let existingTab = mainTabs.findTabByUrl(url);
		
		if (existingTab) {
			mainTabs.selectTab(existingTab);
			
			return existingTab;
		}
		
		let file = await this.app.readFile(url);
		
		if (!file) {
			return null;
		}
		
		return await this.openFile(file);
	}
	
	/*
	NOTE web version might use the file chooser dialog now so
	not sure when/if this will come up 
	*/
	
	async openFilesFromUpload(uploadedFiles) {
		let dir = platform.fs("/upload-" + lid());
		
		await dir.mkdirp();
		
		let files = await bluebird.map(uploadedFiles, ({name, contents}) => {
			return File.write(URL.file(dir.child(name).path), contents);
		});
		
		for (let file of files) {
			await this.openFile(file);
		}
	}
	
	async save(tab: EditorTab): Promise<void> {
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
	
	async saveAs(tab: EditorTab): Promise<void> {
		let {document} = tab;
		let dir = this.app.getCurrentDir(platform.systemInfo.homeDir);
		
		let path = await this.app.dialogs.showSaveAs({
			path: platform.fs(dir, platform.fs(document.path).name).path,
		});
		
		if (path && path !== document.path) {
			await document.saveAs(URL.file(path));
		}
	}
	
	async saveAll(): Promise<void> {
		let [saved, unsaved] = partition(this.app.mainTabs.tabs, tab => tab.isSaved);
		
		await Promise.all([
			bluebird.map(saved, tab => this.app.save(tab)),
			bluebird.each(unsaved, tab => this.app.saveAs(tab)),
		]);
	}
	
	async renameTab(tab: EditorTab): Promise<void> {
		let {document} = tab;
		let {resource} = document;
		
		let path = await platform.saveAs({
			path: oldPath,
		});
		
		if (path && path !== tab.path) {
			await document.saveAs(URL.file(path));
			await resource.delete();
		}
	}
	
	async deleteTab(tab: EditorTab): Promise<void> {
		if (!await confirm("Delete " + tab.path + "?")) {
			return;
		}
		
		let file = tab.document.resource;
		
		await tab.document.resource.delete();
		
		this.closeTab(tab);
	}
}
