let partition = require("utils/array/partition");
let URL = require("modules/URL");
let getPaths = require("./getPaths");
let getFindAndReplaceOptions = require("./getFindAndReplaceOptions");

class Session {
	constructor(app, options) {
		this.app = app;
		this.options = options;
		this.findAndReplaceOptions = getFindAndReplaceOptions(options);
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
		
		this.urlGenerator = this.generateUrls();
		this.nextUrl();
	}
	
	*generateUrls() {
		for (let url of this.urls) {
			yield url;
		}
	}
	
	nextUrl() {
		this.url = this.urlGenerator.next().value;
		
		if (this.url) {
			this.resultGenerator = this.generateResults();
		}
	}
	
	async generateResults() {
		let {app} = this;
		
		if (!app.urlIsOpen(this.url)) {
			await app.openFile(this.url);
		}
	}
	
	async next() {
	}
}

module.exports = Session;
