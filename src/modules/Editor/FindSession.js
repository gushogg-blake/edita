let findAndReplace = require("modules/findAndReplace");

class FindSession {
	constructor(document, startCursor) {
		this.document = document;
		this.startIndex = document.indexFromCursor(startCursor);
		
		this.currentResult = null;
		this.firstResult = null;
	}
	
	find(search, type, caseMode) {
		this.search = search;
		this.type = type;
		this.caseMode = caseMode;
		
		this.generator = this.createGenerator(this.startIndex);
		this.all = this.getAll();
		this.currentResult = null;
	}
	
	next() {
		let {value: result} = this.generator.next();
		
		if (!value) {
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
			return {
				result: null,
			};
		}
		
		let loopedFile = previousIndex > this.currentResult.index;
		
		this.generator = this.createGenerator(previousIndex);
		
		return {
			loopedFile,
			result: this.next().result,
		};
	}
	
	getAll() {
		return [...this.createGenerator(0, true)];
	}
	
	createGenerator(startIndex, enumerate=false) {
		let {
			search,
			type,
			caseMode,
		} = this;
		
		return this.document.find({
			search,
			type,
			caseMode,
			startIndex,
			enumerate,
		});
	}
}

module.exports = FindSession;
