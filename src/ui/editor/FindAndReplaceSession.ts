import {Cursor, c} from "core";
import findAndReplace from "modules/grep/findAndReplace";
import type {Editor} from "ui/editor";

export default class {
	editor: Editor;
	
	private options: any; // TYPE
	private generator: Generator<any>; // TYPE result
	
	// TYPE
	private results: any;
	private countResults: any;
	private currentResult: any;
	private resultsReplaced: any;
	
	constructor(editor: Editor, options) {
		this.editor = editor;
		
		let {document, view} = editor;
		let {searchIn, startCursor} = options;
		let {normalSelection} = view;
		let startIndex = startCursor ? document.indexFromCursor(startCursor) : 0;
		
		this.options = {
			...options,
			startIndex,
			rangeStartIndex: searchIn === "selectedText" ? document.indexFromCursor(normalSelection.left) : 0,
			rangeEndIndex: searchIn === "selectedText" ? document.indexFromCursor(normalSelection.right) : null,
		};
		
		this.generator = this.createGenerator(this.options.startIndex);
		this.results = this.getAllResults();
		this.countResults = this.results.length;
		this.currentResult = null;
		this.resultsReplaced = 0;
		
		this.hiliteResults();
	}
	
	next() {
		let {value: result} = this.generator.next();
		
		if (!result) {
			return null;
		}
		
		this.currentResult = result;
		
		this.goToResult(result);
		
		return result;
	}
	
	previous() {
		if (!this.currentResult) {
			return null;
		}
		
		let previousIndex = findAndReplace.previousIndex(this.currentResult, this.results);
		
		if (previousIndex === null) {
			return null;
		}
		
		let loopedResults = previousIndex > this.currentResult.index;
		let loopedFile = this.options.rangeStartIndex === 0 && loopedResults;
		
		this.generator = this.createGenerator(previousIndex);
		
		let result = this.next();
		
		this.currentResult = result;
		
		this.goToResult(result);
		
		return {
			...result,
			loopedFile,
			loopedResults,
		};
	}
	
	replace(str) {
		if (!this.currentResult) {
			return;
		}
		
		// MIGRATE
		//let {
		//	edit,
		//	newSelection,
		//	entry,
		//} = this.currentResult.replace(str);
		//
		//this.editor.applyExistingDocumentEntry(entry, newSelection);
		
		this.resultsReplaced++;
		
		this.results = this.getAllResults();
	}
	
	hiliteResults() {
		this.editor.view.setNormalHilites(this.results.map(result => result.selection));
	}
	
	goToResult(result) {
		let {view} = this.editor;
		
		view.setNormalSelection(result.selection);
		view.ensureNormalCursorIsOnScreen();
	}
	
	clearHilites() {
		this.editor.view.setNormalHilites([]);
	}
	
	getAllResults() {
		return [...this.createGenerator(0, true)];
	}
	
	createGenerator(startIndex, enumerate=false) {
		return this.editor.document.find({
			...this.options,
			startIndex,
			enumerate,
		});
	}
}
