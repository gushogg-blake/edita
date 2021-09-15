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
		
		this.findAndReplace = {
			findAll(options) {
				return platform.callParentWindow("findAndReplace", "findAll", options);
			},
			
			replaceAll(options) {
				return platform.callParentWindow("findAndReplace", "replaceAll", options);
			},
			
			findNext(options) {
				return platform.callParentWindow("findAndReplace", "findNext", options);
			},
			
			findPrevious(options) {
				return platform.callParentWindow("findAndReplace", "findPrevious", options);
			},
			
			replace(options) {
				return platform.callParentWindow("findAndReplace", "replace", options);
			},
		};
	}
	
	async init() {
		
	}
}

module.exports = App;
