import bluebird from "bluebird";
import fastStableStringify from "fast-stable-stringify";
import Evented from "utils/Evented";
import findAndReplace from "modules/grep/findAndReplace";
import getPaths from "modules/grep/getPaths";
import getDocuments from "modules/grep/getDocuments";
import type {App} from "ui/app";
import Session from "./Session";

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

let maxHistoryEntries = 100;

/*

*/

class FindAndReplace extends Evented<{
	hide: void;
	optionsUpdated: void;
	historyUpdated: void;
	requestFocus: void;
}> {
	private app: App;
	
	constructor(app: App) {
		super();
		
		this.app = app;
		this.session = null;
		
		this.defaultOptions = {
			search: "",
			replace: false,
			searchIn: "files",
			replaceWith: "",
			regex: false,
			caseMode: "caseSensitive",
			word: false,
			multiline: false,
		};
		
		this.savedOptions = null;
		this.options = this.defaultOptions;
		this.history = [];
	}
	
	async init() {
		await Promise.all([
			this.loadOptions(),
			this.loadHistory(),
		]);
	}
	
	private show(options) {
		// TODO use last single-line selection, so we can select a word,
		// then make a selection to find in selection and find will
		// default to the word
		
		let search = "";
		let {selectedTab} = this.app.mainTabs;
		
		if (selectedTab instanceof EditorTab) {
			let {editor} = selectedTab;
			let {document} = editor;
			let selectedText = editor.getSelectedText();
			
			if (selectedText.indexOf(document.format.newline) === -1) {
				search = selectedText;
			}
		}
		
		// INFLIGHT this is why there's no "show" event -- we do it here
		// not sure how hiding works
		this.tools.findAndReplace({
			...this.findAndReplace.defaultOptions,
			...this.findAndReplace.savedOptions,
			search,
			...options,
		});
	}
	
	private hide() {
		this.fire("hide");
		
		// MIGRATE listen to hide in app?
		this.app.mainTabs.focusSelectedTab();
	}
	
	findInOpenFiles() {
		this.show({
			replace: false,
			searchIn: "openFiles",
		});
	}
	
	findInFiles(paths) {
		this.show({
			replace: false,
			searchIn: "files",
			paths,
		});
	}
	
	replaceInFiles(paths) {
		this.show({
			replace: true,
			searchIn: "files",
			paths,
		});
	}
	
	reset() {
		this.session = null;
	}
	
	setOptions(options) {
		this.options = options;
		
		this.fire("optionsUpdated");
	}
	
	useExistingSession(options) {
		return this.session && JSON.stringify(this.session.options) === JSON.stringify(options);
	}
	
	findAllInCurrentDocument(options) {
		return this.app.selectedTab?.editor.api.findAll(getFindAndReplaceOptions(options)) || [];
	}
	
	findAllInSelectedText(options) {
		return this.app.selectedTab?.editor.api.findAllInSelectedText(getFindAndReplaceOptions(options)) || [];
	}
	
	findAllInOpenFiles(options) {
		let results = [];
		
		for (let tab of this.app.editorTabs) {
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
		return this.app.selectedTab?.editor.api.replaceAll(getFindAndReplaceOptions(options)) || [];
	}
	
	replaceAllInSelectedText(options) {
		return this.app.selectedTab?.editor.api.replaceAllInSelectedText(getFindAndReplaceOptions(options)) || [];
	}
	
	replaceAllInOpenFiles(options) {
		let results = [];
		
		for (let tab of this.app.editorTabs) {
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
		let results = await this[getMethod(action, options)](options);
		
		if (results.length > 0 && ["findAll", "replaceAll"].includes(action)) {
			this.app.output.showFindResults(action, options, results);
		}
		
		await this.addOptionsToHistory(options);
		
		return results;
	}
	
	async loadOptions() {
		this.savedOptions = await base.stores.findAndReplaceOptions.load();
	}
	
	async saveOptions(options) {
		this.savedOptions = options;
		
		await base.stores.findAndReplaceOptions.save(options);
	}
	
	async loadHistory() {
		this.history = await base.stores.findAndReplaceHistory.load();
	}
	
	async addOptionsToHistory(options) {
		// re-load in case history has been changed in another window
		await this.loadHistory();
		
		let key = fastStableStringify(options);
		let index = this.history.findIndex(entry => entry.key === key);
		
		if (index !== -1) {
			this.history.splice(index, 1);
		}
		
		this.history.unshift({
			key,
			options,
		});
		
		while (this.history.length > maxHistoryEntries) {
			this.history.pop();
		}
		
		await base.stores.findAndReplaceHistory.save(this.history);
		
		this.fire("historyUpdated");
	}
	
	requestFocus() {
		this.fire("requestFocus");
	}
}
