let find = require("modules/find");

/*
there are a few layers to the find/replace system

the most basic layer is the find.find generator.  this just loops through the
file infinitely, yielding occurrences, and providing a replace() function that
replaces the occurrence with the given string in its internal copy of the code.
this function returns the new code.

this file is the next layer.  it adds functionality like previous() (generators
don't have a previous() method) and wraps the results from the find.find generator,
augmenting the replace() method to update its internal copy of the code.

this is used by Editor, which wraps the result again and augments replace() to
update the original code.
*/

class FindSession {
	constructor(code, startIndex, createResult) {
		this.code = code;
		this.startIndex = startIndex;
		this.createResult = createResult;
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
		let {
			done,
			value: result,
		} = this.generator.next();
		
		if (done) {
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
		
		let previousIndex = find.previousIndex(this.currentResult, this.all);
		
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
	
	*createGenerator(startIndex, enumerate=false) {
		let {
			code,
			search,
			type,
			caseMode,
		} = this;
		
		let generator = find.find(code, search, type, caseMode, startIndex, enumerate);
		
		for (let result of generator) {
			yield this._createResult(result);
		}
	}
	
	_createResult(result) {
		let {index, match, groups, replace} = result;
		
		return this.createResult({
			index,
			match,
			groups,
			
			replace: (str) => {
				this.code = replace(str);
				this.all = this.getAll(); // TODO keep hiliting the replacement?
			},
		});
	}
}

module.exports = FindSession;
