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
		this.session = null;
	}
	
	useExistingSession(options) {
		return this.session && JSON.stringify(this.session.options) === JSON.stringify(options);
	}
	
	findAllInCurrentDocument(options) {
		let {document} = this.app.selectedTab.editor;
		
		let results = document.findAll(getFindAndReplaceOptions(options));
		
		if (results.length > 0) {
			this.app.bottomPane.showFindResults(results);
			
			return true;
		} else {
			return false;
		}
	}
	
	findAllInSelectedText(options) {
		let {editor} = this.app.selectedTab;
		let {document, view} = editor;
		
		let {start, end} = view.getNormalSelectionForFind();
		
		let results = document.findAll({
			...getFindAndReplaceOptions(options),
			startIndex: document.indexFromCursor(start),
			endIndex: document.indexFromCursor(end),
		});
		
		if (results.length > 0) {
			this.app.bottomPane.showFindResults(results);
			
			return true;
		} else {
			return false;
		}
	}
	
	findAllInOpenFiles(options) {
		
	}
	
	async findAllInFiles(options) {
		
	}
	
	replaceAllInCurrentDocument(options) {
		
	}
	
	replaceAllInSelectedText(options) {
		
	}
	
	replaceAllInOpenFiles(options) {
		
	}
	
	async replaceAllInFiles(options) {
		
	}
	
	findNextInCurrentDocument(options) {
		
	}
	
	findNextInSelectedText(options) {
		
	}
	
	findNextInOpenFiles(options) {
		
	}
	
	findPreviousInCurrentDocument(options) {
		
	}
	
	findPreviousInSelectedText(options) {
		
	}
	
	findPreviousInOpenFiles(options) {
		
	}
	
	findAll(options) {
		let {searchIn} = options;
		
		if (searchIn !== "files" && !this.app.selectedTab) {
			return false;
		}
		
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
		
		if (searchIn !== "files" && !this.app.selectedTab) {
			return false;
		}
		
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
	
	findNext(options) {
		if (!this.app.selectedTab) {
			return false;
		}
		
		let {searchIn} = options;
		
		if (searchIn === "currentDocument") {
			return this.findNextInCurrentDocument(options);
		} else if (searchIn === "selectedText") {
			return this.findNextInSelectedText(options);
		} else if (searchIn === "openFiles") {
			return this.findNextInOpenFiles(options);
		}
	}
	
	findPrevious(options) {
		if (!this.app.selectedTab) {
			return false;
		}
		
		let {searchIn} = options;
		
		if (searchIn === "currentDocument") {
			return this.findPreviousInCurrentDocument(options);
		} else if (searchIn === "selectedText") {
			return this.findPreviousInSelectedText(options);
		} else if (searchIn === "openFiles") {
			return this.findPreviousInOpenFiles(options);
		}
	}
	
	replace(options) {
		if (!this.app.selectedTab) {
			return false;
		}
		
		if (!this.session) {
			this.findNext(options);
		}
		
		if (!this.session) {
			return false;
		}
		
		
	}
}

module.exports = FindAndReplace;
