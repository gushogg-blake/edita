let findAndReplace = require("modules/findAndReplace");
let Document = require("modules/Document");

/*
caseMode: "caseSensitive"
excludePatterns: ""
search: ""
includePatterns: ""
multiline: false
paths: ["/home/gus/projects/editor/src"]
regex: false
replace: false
replaceWith: ""
searchIn: "currentDocument"
searchInSubDirs: true
word: false
*/

function getFindAndReplaceOptions(options) {
	let {
		search,
		regex,
		caseMode,
		word,
		//multiline,
	} = options;
	
	return {
		search,
		type: regex ? "regex" : "plain",
		caseMode,
		word,
		enumerate: true,
	};
}

class FindAndReplace {
	constructor(app) {
		this.app = app;
	}
	
	async findAllInCurrentDocument(options) {
		let {document} = this.app.selectedTab.editor;
		
		let results = document.findAll(getFindAndReplaceOptions(options));
		
		if (results.length > 0) {
			this.app.bottomPane.showFindResults(results);
			
			return true;
		} else {
			return false;
		}
	}
	
	async findAllInSelectedText(options) {
		
	}
	
	async findAllInOpenFiles(options) {
		
	}
	
	async findAllInFiles(options) {
		
	}
	
	async replaceAllInCurrentDocument(options) {
		
	}
	
	async replaceAllInSelectedText(options) {
		
	}
	
	async replaceAllInOpenFiles(options) {
		
	}
	
	async replaceAllInFiles(options) {
		
	}
	
	async findNextInCurrentDocument(options, currentResult) {
		
	}
	
	async findNextInSelectedText(options, currentResult) {
		
	}
	
	async findNextInOpenFiles(options, currentResult) {
		
	}
	
	async findPreviousInCurrentDocument(options, currentResult) {
		
	}
	
	async findPreviousInSelectedText(options, currentResult) {
		
	}
	
	async findPreviousInOpenFiles(options, currentResult) {
		
	}
	
	async replaceInCurrentDocument(options, currentResult) {
		
	}
	
	async replaceInSelectedText(options, currentResult) {
		
	}
	
	async replaceInOpenFiles(options, currentResult) {
		
	}
	
	findAll(options) {
		let {searchIn} = options;
		
		if (searchIn === "currentDocument") {
			return this.findAllInCurrentDocument(options);
		} else if (searchIn === "selectedText") {
			return this.findAllInSelectedText(options);
		} else if (searchIn === "openFiles") {
			return this.findAllInOpenFiles(options);
		} else if (searchIn === "files") {
			return this.findAllInFiles(options);
		}
	}
	
	replaceAll(options) {
		let {searchIn} = options;
		
		if (searchIn === "currentDocument") {
			return this.replaceAllInCurrentDocument(options);
		} else if (searchIn === "selectedText") {
			return this.replaceAllInSelectedText(options);
		} else if (searchIn === "openFiles") {
			return this.replaceAllInOpenFiles(options);
		} else if (searchIn === "files") {
			return this.replaceAllInFiles(options);
		}
	}
	
	findNext(options, currentResult) {
		let {searchIn} = options;
		
		if (searchIn === "currentDocument") {
			return this.findNextInCurrentDocument(options, currentResult);
		} else if (searchIn === "selectedText") {
			return this.findNextInSelectedText(options, currentResult);
		} else if (searchIn === "openFiles") {
			return this.findNextInOpenFiles(options, currentResult);
		}
	}
	
	findPrevious(options, currentResult) {
		let {searchIn} = options;
		
		if (searchIn === "currentDocument") {
			return this.findPreviousInCurrentDocument(options, currentResult);
		} else if (searchIn === "selectedText") {
			return this.findPreviousInSelectedText(options, currentResult);
		} else if (searchIn === "openFiles") {
			return this.findPreviousInOpenFiles(options, currentResult);
		}
	}
	
	replace(options, currentResult) {
		let {searchIn} = options;
		
		if (searchIn === "currentDocument") {
			return this.replaceInCurrentDocument(options, currentResult);
		} else if (searchIn === "selectedText") {
			return this.replaceInSelectedText(options, currentResult);
		} else if (searchIn === "openFiles") {
			return this.replaceInOpenFiles(options, currentResult);
		}
	}
}

module.exports = FindAndReplace;
