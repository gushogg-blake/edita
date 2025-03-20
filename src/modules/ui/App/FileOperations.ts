export default class {
	constructor(app) {
		this.app = app;
	}
	
	async newFile(lang=null) {
		let format = base.getDefaultFormat(lang);
		
		({lang} = format);
		
		let {defaultExtension} = lang;
		let extension = defaultExtension ? "." + defaultExtension : "";
		let name = nextName(n => lang.name + "-" + n + extension, name => !this.editorTabs.some(tab => tab.path.includes(name)));
		let dir = this.selectedProject?.dirs[0].path || platform.systemInfo.homeDir;
		let path = platform.fs(dir).child(name).path;
		
		let tab = await this.app.mainTabs.newFile(URL._new(path), format);
		
		this.app.mainTabs.selectTab(tab);
		this.app.focusSelectedTab();
		
		return tab;
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
			code = await readFileForOpen(path);
			
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
