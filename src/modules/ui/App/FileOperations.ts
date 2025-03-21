import {lid, partition} from "utils";
import {URL} from "modules/core";
import {File, NewFile} from "modules/core/resources";

export default class {
	constructor(app) {
		this.app = app;
	}
	
	async newFile(lang=base.getDefaultLang()) {
		let {mainTabs} = this.app;
		
		let dir = this.app.selectedProject?.dirs[0].path || platform.systemInfo.homeDir;
		let url = mainTabs.nextNewFileName(dir, lang);
		let resource = await NewFile.create(url);
		let tab = await mainTabs.newFile(resource);
		
		this.app.mainTabs.selectTab(tab);
		this.app.focusSelectedTab();
		
		return tab;
	}
	
	private async openFile(file) {
		return await this.app.mainTabs.openFile(file);
	}
	
	openPath(path) {
		return this.openUrl(URL.file(path));
	}
	
	async openUrl(url) {
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
		
		await dir.child("placeholder").mkdirp();
		
		let files = await bluebird.map(uploadedFiles, ({name, contents}) => {
			return File.write(URL.file(dir.child(name).path), contents);
		});
		
		for (let file of files) {
			await this.openFile(file);
		}
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
		
		let dir = this.app.getCurrentDir(platform.systemInfo.homeDir);
		
		let path = await this.app.dialogs.showSaveAs({
			path: platform.fs(dir, platform.fs(document.path).name).path,
		});
		
		// TODO check if it's different
		
		if (path) {
			await document.saveAs(URL.file(path));
		}
	}
	
	async saveAll() {
		let [saved, unsaved] = partition(this.app.mainTabs.tabs, tab => tab.isSaved);
		
		await Promise.all([
			bluebird.map(saved, tab => this.app.save(tab)),
			bluebird.each(unsaved, tab => this.app.saveAs(tab)),
		]);
	}
	
	async renameTab(tab) {
		throw "migrate";
		
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
	
	async deleteTab(tab) {
		throw "migrate";
		
		if (!await confirm("Delete " + tab.path + "?")) {
			return;
		}
		
		await protocol(tab.url).delete();
		
		this.closeTab(tab);
	}
}
