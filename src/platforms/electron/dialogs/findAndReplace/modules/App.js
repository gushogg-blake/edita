let bluebird = require("bluebird");
let Evented = require("utils/Evented");

class App extends Evented {
	constructor(options) {
		super();
		
		this.options = {
			replace: false,
			searchIn: "currentDocument",
			find: "",
			replaceWith: "",
			regex: false,
			caseMode: "caseSensitive",
			word: false,
			multiline: false,
			paths: "",
			searchInSubDirs: true,
			includeGlob: "",
			excludeGlob: "",
			...options,
		};
	}
	
	async init() {
		
	}
	
	setOptions(options) {
		this.options = options;
	}
	
	findAll() {
		
	}
	
	replaceAll() {
	}
	
	findNext() {
	}
	
	findPrevious() {
	}
	
	replace() {
	}
}

module.exports = App;
