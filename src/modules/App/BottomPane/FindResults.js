let Evented = require("utils/Evented");

let maxResultsToRemember = 12;

class FindResults extends Evented {
	constructor(app) {
		super();
		
		this.app = app;
		
		this.results = [];
		this.index = null;
	}
	
	add(results) {
		this.results.push(results);
		
		if (this.results.length > maxResultsToRemember) {
			this.results.shift();
		}
		
		this.index = this.results.length - 1;
		
		this.fire("resultsAdded");
	}
	
	forward() {
		if (this.index === null || this.index === this.results.length - 1) {
			return;
		}
		
		this.index++;
		
		this.fire("nav");
	}
	
	back() {
		if (this.index === null || this.index === 0) {
			return;
		}
		
		this.index--;
		
		this.fire("nav");
	}
	
	async goToResult(result) {
		let {document, selection} = result;
		
		await app.openFile(document.url);
		
		let {api: editorApi} = app.selectedTab.editor;
		
		editorApi.setNormalSelectionAndCenter(selection);
	}
	
	get currentResults() {
		return this.index !== null ? this.results[this.index] : null;
	}
}

module.exports = FindResults;
