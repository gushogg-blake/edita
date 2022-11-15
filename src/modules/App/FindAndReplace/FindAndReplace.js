let bluebird = require("bluebird");
let findAndReplace = require("modules/findAndReplace");
let getPaths = require("./getPaths");
let getFindAndReplaceOptions = require("./getFindAndReplaceOptions");
let getDocuments = require("./getDocuments");
let Session = require("./Session");

let methods = {
	findAll: {
		currentDocument: "findAllInCurrentDocument",
		selectedText: "findAllInSelectedText",
		openFiles: "findAllInOpenFiles",
		files: "findAllInFiles",
	},
	
	replaceAll: {
		currentDocument: "replaceAllInCurrentDocument",
		selectedText: "replaceAllInSelectedText",
		openFiles: "replaceAllInOpenFiles",
		files: "replaceAllInFiles",
	},
};

function getMethod(action, options) {
	return methods[action][options.searchIn];
}

function shouldShowResults(action, options) {
	return options.showResults || ["findAll", "replaceAll"].includes(action);
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
		return this.app.selectedTab.editor.api.findAll(getFindAndReplaceOptions(options));
	}
	
	findAllInSelectedText(options) {
		return this.app.selectedTab.editor.api.findAllInSelectedText(getFindAndReplaceOptions(options));
	}
	
	findAllInOpenFiles(options) {
		let results = [];
		
		for (let tab of this.app.tabs) {
			results = [...results, ...tab.editor.api.findAll(getFindAndReplaceOptions(options))];
		}
		
		return results;
	}
	
	async findAllInFiles(options) {
		let {app} = this;
		let paths = await getPaths(options);
		let openPaths = paths.filter(path => app.pathIsOpen(path));
		let nonOpenPaths = paths.filter(path => !app.pathIsOpen(path));
		let openTabs = openPaths.map(path => app.findTabByPath(path));
		let nonOpenDocuments = await getDocuments(nonOpenPaths);
		let findAndReplaceOptions = getFindAndReplaceOptions(options);
		
		let allResults = [];
		
		for (let document of nonOpenDocuments) {
			allResults = [...allResults, ...document.findAll(findAndReplaceOptions)];
		}
		
		for (let tab of openTabs) {
			allResults = [...allResults, ...tab.editor.api.findAll(findAndReplaceOptions)];
		}
		
		return allResults;
	}
	
	replaceAllInCurrentDocument(options) {
		return this.app.selectedTab.editor.api.replaceAll(getFindAndReplaceOptions(options));
	}
	
	replaceAllInSelectedText(options) {
		return this.app.selectedTab.editor.api.replaceAllInSelectedText(getFindAndReplaceOptions(options));
	}
	
	replaceAllInOpenFiles(options) {
		let results = [];
		
		for (let tab of this.app.tabs) {
			results = [...results, ...tab.editor.api.replaceAll(getFindAndReplaceOptions(options))];
		}
		
		return results;
	}
	
	async replaceAllInFiles(options) {
		let {app} = this;
		let paths = await getPaths(options);
		let openPaths = paths.filter(path => app.pathIsOpen(path));
		let nonOpenPaths = paths.filter(path => !app.pathIsOpen(path));
		let openTabs = openPaths.map(path => app.findTabByPath(path));
		let nonOpenDocuments = await getDocuments(nonOpenPaths);
		let findAndReplaceOptions = getFindAndReplaceOptions(options);
		
		let allResults = [];
		
		await bluebird.map(nonOpenDocuments, async function(document) {
			let {edits, results} = document.replaceAll(findAndReplaceOptions);
			
			document.applyEdits(edits);
			
			await document.save();
			
			allResults = [...allResults, ...results];
		});
		
		for (let tab of openTabs) {
			let save = !tab.modified;
			
			allResults = [...allResults, ...tab.editor.api.replaceAll(findAndReplaceOptions)];
			
			if (save) {
				app.save(tab);
			}
		}
		
		return allResults;
	}
	
	findAll(options) {
		return this.run("findAll", options);
	}
	
	replaceAll(options) {
		return this.run("replaceAll", options);
	}
		
	async run(action, options) {
		if (options.searchIn !== "files" && !this.app.selectedTab) {
			return [];
		}
		
		let results = await this[getMethod(action, options)](options);
		
		if (results.length > 0 && shouldShowResults(action, options)) {
			this.app.bottomPane.showFindResults(action, options, results);
		}
		
		return results;
	}
	
	async ensureSession(options) {
		if (this.useExistingSession(options)) {
			return;
		}
		
		this.session = new Session(this.app, options);
		
		await this.session.init();
	}
	
	async findNext(options) {
		await this.ensureSession(options);
		
		let done = false;
		let counts = null;
		let result = await this.session.next();
		
		if (!result) {
			done = true;
			counts = this.session.countResults();
			
			this.session = null;
		}
		
		return {
			done,
			counts,
		};
	}
	
	async findPrevious(options) {
		await this.ensureSession(options);
		
		let done = false;
		let counts = null;
		let result = await this.session.previous();
		
		if (!result) {
			done = true;
			counts = this.session.countResults();
			
			this.session = null;
		}
		
		return {
			done,
			counts,
		};
	}
	
	replace(options) {
		this.session.replace();
	}
	
	loadOptions() {
		return base.stores.findAndReplaceOptions.load();
	}
	
	saveOptions(options) {
		return base.stores.findAndReplaceOptions.save(options);
	}
}

module.exports = FindAndReplace;
