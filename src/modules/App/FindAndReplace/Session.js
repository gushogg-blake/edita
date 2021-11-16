let partition = require("utils/array/partition");
let URL = require("modules/URL");
let getPaths = require("./getPaths");
let getFindAndReplaceOptions = require("./getFindAndReplaceOptions");

class Session {
	constructor(app, options) {
		this.app = app;
		this.options = options;
		this.findAndReplaceOptions = getFindAndReplaceOptions(options);
		
		this.urls = [];
		this.urlIndex = -1;
		this.openedTabs = new WeakSet();
		
		this.currentResult = null;
	}
	
	async init() {
		let {app, options} = this;
		let {searchIn} = options;
		
		if (searchIn === "currentDocument" || searchIn === "selectedText") {
			this.urls = [app.selectedTab.url];
		} else if (searchIn === "openFiles") {
			this.urls = app.tabs.map(tab => tab.url);
		} else if (searchIn === "files") {
			this.urls = partition(await getPaths(options), path => app.pathIsOpen(path)).map(path => URL.file(path));
		}
		
		this.nextUrl();
	}
	
	get url() {
		return this.urls[this.urlIndex];
	}
	
	get tab() {
		return this.app.findTabByUrl(this.url);
	}
	
	async _nextUrl(dir) {
		this.editorSession = null;
		
		this.urlIndex += dir;
		
		let {url} = this;
		
		if (!url) {
			return;
		}
		
		if (!app.urlIsOpen(url)) {
			await app.openFile(url);
			
			this.openedTabs.add(this.tab);
		}
		
		app.selectTab(this.tab);
		
		this.createEditorSession();
	}
	
	nextUrl() {
		return this._nextUrl(1);
	}
	
	previousUrl() {
		return this._nextUrl(-1);
	}
	
	createEditorSession() {
		this.editorSession = this.tab.editor.api.findAndReplace(this.findAndReplaceOptions);
	}
	
	async next() {
		if (!this.editorSession) {
			this.currentResult = null;
			
			return null;
		}
		
		let result = this.editorSession.next();
		
		if (!result || result.loopedFile) {
			if (this.editorSession.results.length === 0 && this.openedTabs.has(this.tab)) {
				await this.app.closeTab(this.tab);
			}
			
			await this.nextUrl();
			
			return await this.next();
		}
		
		this.currentResult = result;
		
		return result;
	}
	
	async previous() {
		if (!this.editorSession) {
			this.currentResult = null;
			
			return null;
		}
		
		let result = this.editorSession.previous();
		
		if (!result || result.loopedFile) {
			if (this.editorSession.results.length === 0 && this.openedTabs.has(this.tab)) {
				await this.app.closeTab(this.tab);
			}
			
			await this.previousUrl();
			
			return await this.previous();
		}
		
		let {loopedFile} = result;
		
		console.log(result);
		console.log(loopedFile);
		
		this.currentResult = result;
		
		return result;
	}
	
	replace() {
		this.editorSession.replace(this.options.replaceWith);
	}
}

module.exports = Session;
