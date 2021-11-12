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
		this.all = this.getAll();
		this.currentResult = null;
		this.firstResult = null;
		
		this.hiliteResults();
		this.next();
	}
	
	next() {
		let {value: result} = this.generator.next();
		
		if (!result) {
			return null;
		}
		
		let loopedFile = (
			this.currentResult && result.index < this.currentResult.index
			|| !this.currentResult && result.index < this.startIndex
		);
		
		this.currentResult = result;
		
		// TODO loopedResults
		//if (!this.firstResult) {
		//	this.firstResult = result;
		//}
		
		this.goToResult(result);
		
		return {
			loopedFile,
			//loopedResults,
			result,
		};
	}
	
	previous() {
		if (!this.currentResult) {
			return null;
		}
		
		let previousIndex = findAndReplace.previousIndex(this.currentResult, this.all);
		
		if (previousIndex === null) {
			return null;
		}
		
		let loopedFile = previousIndex > this.currentResult.index;
		
		this.generator = this.createGenerator(previousIndex);
		
		this.goToResult(result);
		
		return {
			loopedFile,
			result: this.next().result,
		};
	}
	
	hiliteResults() {
		this.editor.view.setNormalHilites(this.all.map(result => result.selection));
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
	
	getAll() {
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
