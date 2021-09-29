let bluebird = require("bluebird");
let findAndReplace = require("modules/findAndReplace");
let Document = require("modules/Document");
let {FileIsBinary} = require("modules/errors");

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
		replaceWith,
		regex,
		caseMode,
		word,
		//multiline,
	} = options;
	
	return {
		search,
		replaceWith,
		type: regex ? "regex" : "plain",
		caseMode,
		word,
		enumerate: true,
	};
}

async function getPaths(options) {
	let {
		paths,
		includePatterns,
		excludePatterns,
		searchInSubDirs,
	} = options;
	
	let walkOptions = {
		includePatterns,
		excludePatterns,
		searchInSubDirs,
	};
	
	let allPaths = [];
	
	for (let path of paths) {
		allPaths = [...allPaths, ...await platform.walk.all(path, walkOptions)];
	}
	
	return allPaths;
}

async function getDocuments(paths) {
	return bluebird.map(paths, async function(path) {
		try {
			let code = await platform.fs(path).read();
			
			return new Document(code, path, {
				noParse: true,
			});
		} catch (e) {
			if (e instanceof FileIsBinary) {
				console.info("Skipping binary file " + path);
			} else {
				console.error(e);
			}
			
			return null;
		}
	}).filter(Boolean);
}

class FindAndReplace {
	constructor(app) {
		this.app = app;
		this.session = null;
	}
	
	init() {
		this.session = null;
	}
	
	useExistingSession(options) {
		return this.session && JSON.stringify(this.session.options) === JSON.stringify(options);
	}
	
	findAllInCurrentDocument(options) {
		let results = this.app.selectedTab.editor.api.findAll(getFindAndReplaceOptions(options));
		
		if (results.length > 0) {
			this.app.bottomPane.showFindResults(results);
			
			return true;
		} else {
			return false;
		}
	}
	
	findAllInSelectedText(options) {
		let results = this.app.selectedTab.editor.api.findAllInSelectedText(getFindAndReplaceOptions(options));
		
		if (results.length > 0) {
			this.app.bottomPane.showFindResults(results);
			
			return true;
		} else {
			return false;
		}
	}
	
	findAllInOpenFiles(options) {
		let results = [];
		
		for (let tab of this.app.tabs) {
			results = [...results, ...tab.editor.api.findAll(getFindAndReplaceOptions(options))];
		}
		
		if (results.length > 0) {
			this.app.bottomPane.showFindResults(results);
			
			return true;
		} else {
			return false;
		}
	}
	
	async findAllInFiles(options) {
		let paths = await getPaths(options);
		let documents = await getDocuments(paths);
		let findAndReplaceOptions = getFindAndReplaceOptions(options);
		
		let allResults = [];
		
		debugger
		
		for (let document of documents) {
			allResults = [...allResults, ...document.findAll(findAndReplaceOptions)];
		}
		
		if (allResults.length > 0) {
			this.app.bottomPane.showFindResults(allResults);
			
			return true;
		} else {
			return false;
		}
	}
	
	replaceAllInCurrentDocument(options) {
		let results = this.app.selectedTab.editor.api.replaceAll(getFindAndReplaceOptions(options));
		
		if (results.length > 0) {
			this.app.bottomPane.showFindResults(results);
			
			return true;
		} else {
			return false;
		}
	}
	
	replaceAllInSelectedText(options) {
		let results = this.app.selectedTab.editor.api.replaceAllInSelectedText(getFindAndReplaceOptions(options));
		
		if (results.length > 0) {
			this.app.bottomPane.showFindResults(results);
			
			return true;
		} else {
			return false;
		}
	}
	
	replaceAllInOpenFiles(options) {
		let results = [];
		
		for (let tab of this.app.tabs) {
			results = [...results, ...tab.editor.api.replaceAll(getFindAndReplaceOptions(options))];
		}
		
		if (results.length > 0) {
			this.app.bottomPane.showFindResults(results);
			
			return true;
		} else {
			return false;
		}
	}
	
	async replaceAllInFiles(options) {
		debugger
		let paths = await getPaths(options);
		let documents = await getDocuments(paths);
		let findAndReplaceOptions = getFindAndReplaceOptions(options);
		
		let allResults = [];
		
		let n = 0;
		
		await bluebird.map(documents, async function(document) {
			n++;
			
			if (n > 9) {
				throw "stop";
			}
			
			let {edits, results} = document.replaceAll(findAndReplaceOptions);
			
			console.log(document);
			
			document.applyEdits(edits);
			
			//await document.save();
			
			allResults = [...allResults, ...results];
		});
		
		if (allResults.length > 0) {
			this.app.bottomPane.showFindResults(allResults);
			
			return true;
		} else {
			return false;
		}
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
