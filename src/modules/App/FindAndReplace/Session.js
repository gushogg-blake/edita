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
		
		this.editorSessions = new WeakMap();
		
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
		return this.urls[this.urlIndex] || null;
	}
	
	get tab() {
		return this.url && this.app.findTabByUrl(this.url);
	}
	
	async _nextUrl(dir) {
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
		
		this.ensureEditorSession();
	}
	
	async nextUrl() {
		await this._nextUrl(1);
		
		this.createEditorSession();
	}
	
	async previousUrl() {
		await this._nextUrl(-1);
	}
	
	get editorSession() {
		return this.editorSessions.get(this.tab);
	}
	
	createEditorSession() {
		this.editorSessions.set(this.tab, this.tab.editor.api.findAndReplace(this.findAndReplaceOptions));
	}
	
	ensureEditorSession() {
		if (!this.editorSession) {
			this.createEditorSession();
		}
	}
	
	async next() {
		this.currentResult = null;
		
		if (!this.editorSession) {
			return null;
		}
		
		let result = this.editorSession.next();
		
		if (!result || result.loopedFile) {
			if (this.editorSession.results.length === 0 && this.openedTabs.has(this.tab)) {
				await this.app.closeTab(this.tab, true);
			}
			
			await this.nextUrl();
			
			return await this.next();
		}
		
		this.currentResult = result;
		
		return result;
	}
	
	async previous() {
		this.currentResult = null;
		
		let result = this.editorSession.previous();
		
		if (!result || result.loopedFile) {
			await this.previousUrl();
			
			result = this.editorSession?.currentResult;
		}
		
		this.currentResult = result;
		
		return result;
	}
	
	replace() {
		this.editorSession.replace(this.options.replaceWith);
	}
}

module.exports = Session;
