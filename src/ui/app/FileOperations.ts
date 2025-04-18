import bluebird from "bluebird";
import {lid, partition} from "utils";
import {FileLikeURL, type Lang} from "core";
import {File, NewFile} from "core/resource";
import type {App} from "ui/app";
import type EditorTab from "ui/app/tabs/EditorTab";

export default class {
	app: App;
	
	constructor(app: App) {
		this.app = app;
	}
	
	async newFile(lang: Lang = base.getDefaultLang()): Promise<EditorTab> {
		let {mainTabs} = this.app;
		
		let dir = this.app.selectedProject?.dirs[0].path || platform.systemInfo.homeDir;
		let url = mainTabs.nextNewFileName(dir, lang);
		let resource = await NewFile.create(url);
		let tab = await mainTabs.newFile(resource);
		
		this.app.mainTabs.selectTab(tab);
		this.app.focusSelectedTab();
		
		return tab;
	}
	
	async openFile(file: File): Promise<EditorTab> {
		return await this.app.mainTabs.openFile(file);
	}
	
	openPath(path: string): Promise<EditorTab> {
		return this.openUrl(FileLikeURL.file(path));
	}
	
	async openUrl(url: FileLikeURL): Promise<EditorTab> {
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
			return File.write(FileLikeURL.file(dir.child(name).path), contents);
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
			await document.saveAs(FileLikeURL.file(path));
		}
	}
	
	async saveAll(): Promise<void> {
		let [saved, unsaved] = partition(this.app.mainTabs.tabs, tab => tab.isSaved);
		
		await Promise.all([
			bluebird.map(saved, tab => this.save(tab)),
			bluebird.each(unsaved, tab => this.saveAs(tab)),
		]);
	}
	
	async renameTab(tab: EditorTab): Promise<void> {
		let {document, path: oldPath} = tab;
		let {resource} = document;
		
		let path = await this.app.dialogs.showSaveAs({
			path: oldPath,
		});
		
		if (path && path !== oldPath) {
			await document.saveAs(FileLikeURL.file(path));
			await resource.delete();
		}
	}
	
	async deleteTab(tab: EditorTab): Promise<void> {
		if (!await confirm("Delete " + tab.path + "?")) {
			return;
		}
		
		let file = tab.document.resource;
		
		await tab.document.resource.delete();
		
		this.app.mainTabs.closeTab(tab);
	}
}
