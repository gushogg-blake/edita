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
			includePatterns: "",
			excludePatterns: "",
			...options,
		};
		
		this.findAndReplace = {
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
		};
	}
	
	async init() {
		
	}
}

module.exports = App;
