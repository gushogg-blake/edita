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
		
		this.editorSessions = new Map();
		
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
			let paths = await getPaths(options);
			let openPaths = app.tabs.map(tab => tab.path).filter(path => paths.includes(path));
			let nonOpenPaths = paths.filter(path => !openPaths.includes(path));
			
			this.urls = [...openPaths, ...nonOpenPaths].map(path => URL.file(path));
		}
		
		await this.nextUrl();
	}
	
	get url() {
		return this.urls[this.urlIndex] || null;
	}
	
	get tab() {
		return this.url && this.app.findTabByUrl(this.url);
	}
	
	async nextUrl() {
		this.urlIndex++;
		
		let {app, url} = this;
		
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
	
	previousUrl() {
		do {
			this.urlIndex--;
		} while(this.url && !this.app.urlIsOpen(this.url));
		
		if (!this.url) {
			return;
		}
		
		this.app.selectTab(this.tab);
	}
	
	get editorSession() {
		return this.editorSessions.get(this.tab);
	}
	
	countResults() {
		let total = 0;
		let replaced = 0;
		
		for (let session of this.editorSessions.values()) {
			total += session.results.length;
			replaced += session.resultsReplaced;
		}
		
		return {total, replaced};
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
			if (result?.loopedFile) {
				this.editorSession.previous();
			}
			
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
		
		if (result.loopedFile) {
			this.editorSession.next();
			
			this.previousUrl();
			
			if (!this.editorSession) {
				return null;
			}
			
			result = this.editorSession?.currentResult || null;
		}
		
		this.currentResult = result;
		
		return result;
	}
	
	replace() {
		this.editorSession.replace(this.options.replaceWith);
	}
}

module.exports = Session;
