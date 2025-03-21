import {URL} from "modules/core";
import {File, NewFile} from "modules/core/resources";

export default class {
	constructor(app) {
		this.app = app;
	}
	
	async newFile(lang=base.getDefaultLang()) {
		let dir = this.app.selectedProject?.dirs[0].path || platform.systemInfo.homeDir;
		let url = this.app.mainTabs.nextNewFileName(dir, lang);
		let resource = await NewFile.create(url);
		let tab = await this.app.mainTabs.newFile(resource);
		
		this.app.mainTabs.selectTab(tab);
		this.app.focusSelectedTab();
		
		return tab;
	}
	
	async openPath(path) {
		return await this.openFile(URL.file(path));
	}
	
	async openFile(file) {
		let {mainTabs} = this.app;
		
		let existingTab = mainTabs.findTabByUrl(url);
		
		if (existingTab) {
			mainTabs.selectTab(existingTab);
			
			return existingTab;
		}
		
		return mainTabs.openFile(file);
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
		
		let path = await this.dialogs.showSaveAs({
			path: platform.fs(dir, platform.fs(document.path).name).path,
		});
		
		// TODO check if it's different
		
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
	
	async deleteTab(tab) {
		if (!await confirm("Delete " + tab.path + "?")) {
			return;
		}
		
		await protocol(tab.url).delete();
		
		this.closeTab(tab);
	}
}
