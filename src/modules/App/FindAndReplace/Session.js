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
	
	async nextUrl() {
		this.urlIndex++;
		
		let {url} = this;
		
		if (!url) {
			return;
		}
		
		if (!app.urlIsOpen(url)) {
			await app.openFile(url);
		}
		
		this.createEditorSession();
	}
	
	createEditorSession() {
		let {editor} = this.app.findTabByUrl(this.url);
		
		this.editorSession = editor.api.findAndReplace(this.findAndReplaceOptions);
	}
	
	async next() {
		let result = this.editorSession.next();
		
		console.log(result);
		
		return result;
	}
	
	async previous() {
		
	}
	
	replace() {
		
	}
}

module.exports = Session;
