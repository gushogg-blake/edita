let Evented = require("utils/Evented");

let maxPages = 12;

class FindResults extends Evented {
	constructor(app) {
		super();
		
		this.app = app;
		
		this.pages = [];
		this.index = null;
	}
	
	add(options, results) {
		this.pages.unshift({options, results});
		
		if (this.pages.length > maxPages) {
			this.pages.pop();
		}
		
		this.index = 0;
		
		this.fire("resultsAdded");
	}
	
	//forward() {
	//	if (this.index === null || this.index === 0) {
	//		return;
	//	}
	//	
	//	this.index--;
	//	
	//	this.fire("nav");
	//}
	//
	//back() {
	//	if (this.index === null || this.index === this.pages.length - 1) {
	//		return;
	//	}
	//	
	//	this.index++;
	//	
	//	this.fire("nav");
	//}
	
	goToPage(index) {
		this.index = index;
		
		this.fire("nav");
	}
	
	async goToResult(result) {
		let {document, selection} = result;
		
		await this.app.openFile(document.url);
		
		let {api: editorApi} = this.app.selectedTab.editor;
		
		editorApi.setNormalSelectionAndCenter(selection);
	}
	
	get currentPage() {
		return this.index !== null ? this.pages[this.index] : null;
	}
	
	rerun() {
		
	}
	
	edit() {
		this.app.showFindDialog(this.currentPage.options);
	}
}

module.exports = FindResults;
