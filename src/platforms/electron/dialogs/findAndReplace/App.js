let Evented = require("utils/Evented");

class App extends Evented {
	constructor(options) {
		super();
		
		this.options = {
			replace: false,
			searchIn: "currentDocument",
			search: "",
			replaceWith: "",
			regex: false,
			caseMode: "caseSensitive",
			word: false,
			multiline: false,
			paths: [],
			searchInSubDirs: true,
			includePatterns: [],
			excludePatterns: [],
			showResults: false,
			...options,
		};
		
		this.findAndReplace = {
			init() {
				return platform.callOpener("findAndReplace", "init");
			},
			
			findAll(options) {
				return platform.callOpener("findAndReplace", "findAll", options);
			},
			
			replaceAll(options) {
				return platform.callOpener("findAndReplace", "replaceAll", options);
			},
			
			findNext(options) {
				return platform.callOpener("findAndReplace", "findNext", options);
			},
			
			findPrevious(options) {
				return platform.callOpener("findAndReplace", "findPrevious", options);
			},
			
			replace(options) {
				return platform.callOpener("findAndReplace", "replace", options);
			},
			
			saveOptions(options) {
				return platform.callOpener("findAndReplace", "saveOptions", options);
			},
		};
	}
	
	async init() {
		
	}
}

module.exports = App;
