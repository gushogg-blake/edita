let findAndReplace = require("modules/findAndReplace");
let Cursor = require("modules/utils/Cursor");

let {c} = Cursor;

module.exports = class {
	constructor(editor, options) {
		this.editor = editor;
		this.options = options;
		
		if (options.startAtCursor) {
			let cursor = editor.mode === "normal" ? editor.normalSelection.start : c(editor.astSelection.startLineIndex, 0);
			
			this.startIndex = editor.document.indexFromCursor(cursor);
		} else {
			this.startIndex = 0;
		}
		
		this.generator = this.createGenerator(this.startIndex);
		this.results = this.getAllResults();
		this.currentResult = null;
		this.firstResult = null;
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
		let loopedFile = this.options.startIndex === 0 && loopedResults;
		
		this.generator = this.createGenerator(previousIndex);
		
		let {result} = this.next();
		
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
		
		let {
			edit,
			newSelection,
			entry,
		} = this.currentResult.replace(str);
		
		this.editor.applyExistingDocumentEntry(entry, newSelection);
	}
	
	hiliteResults() {
		this.editor.view.setNormalHilites(this.results.map(result => result.selection));
	}
	
	goToResult(result) {
		let {view} = this.editor;
		
		view.startBatch();
		
		view.setNormalSelection(result.selection);
		view.ensureNormalCursorIsOnScreen();
		
		view.endBatch();
	}
	
	clearHilites() {
		this.editor.view.setNormalHilites([]);
	}
	
	getAllResults() {
		return [...this.createGenerator(this.options.startIndex, true)];
	}
	
	createGenerator(startIndex, enumerate=false) {
		return this.editor.document.find({
			...this.options,
			startIndex,
			enumerate,
		});
	}
}
