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

class FindAndReplace {
	constructor(app) {
		this.app = app;
	}
	
	createGenerator(options, code) {
		let {
			search,
			regex,
			caseMode,
			word,
			//multiline,
		} = options;
		
		
		
		return findAndReplace.find({
			code,
			search,
			type: regex ? "regex" : "plain",
			caseMode,
			word,
			enumerate: true,
		});
	}
	
	async findAllInCurrentDocument(options) {
		let {document} = this.app.selectedTab.editor;
		
		let occurrences = [...this.createGenerator(options, document.string)];
		
		console.log(occurrences);
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
	
	async findNextInCurrentDocument(options, currentOccurrence) {
		
	}
	
	async findNextInSelectedText(options, currentOccurrence) {
		
	}
	
	async findNextInOpenFiles(options, currentOccurrence) {
		
	}
	
	async findPreviousInCurrentDocument(options, currentOccurrence) {
		
	}
	
	async findPreviousInSelectedText(options, currentOccurrence) {
		
	}
	
	async findPreviousInOpenFiles(options, currentOccurrence) {
		
	}
	
	async replaceInCurrentDocument(options, currentOccurrence) {
		
	}
	
	async replaceInSelectedText(options, currentOccurrence) {
		
	}
	
	async replaceInOpenFiles(options, currentOccurrence) {
		
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
	
	findNext(options, currentOccurrence) {
		let {searchIn} = options;
		
		if (searchIn === "currentDocument") {
			return this.findNextInCurrentDocument(options, currentOccurrence);
		} else if (searchIn === "selectedText") {
			return this.findNextInSelectedText(options, currentOccurrence);
		} else if (searchIn === "openFiles") {
			return this.findNextInOpenFiles(options, currentOccurrence);
		}
	}
	
	findPrevious(options, currentOccurrence) {
		let {searchIn} = options;
		
		if (searchIn === "currentDocument") {
			return this.findPreviousInCurrentDocument(options, currentOccurrence);
		} else if (searchIn === "selectedText") {
			return this.findPreviousInSelectedText(options, currentOccurrence);
		} else if (searchIn === "openFiles") {
			return this.findPreviousInOpenFiles(options, currentOccurrence);
		}
	}
	
	replace(options, currentOccurrence) {
		let {searchIn} = options;
		
		if (searchIn === "currentDocument") {
			return this.replaceInCurrentDocument(options, currentOccurrence);
		} else if (searchIn === "selectedText") {
			return this.replaceInSelectedText(options, currentOccurrence);
		} else if (searchIn === "openFiles") {
			return this.replaceInOpenFiles(options, currentOccurrence);
		}
	}
}

module.exports = FindAndReplace;
