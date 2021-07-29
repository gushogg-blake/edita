let find = require("./find");

/*
there are a few layers to the find/replace system

the most basic layer is the find.find generator.  this just loops through the
file once, yielding occurrences, and providing a replace() function that replaces
the occurrence with the given string in its internal copy of the code.  this
function returns the new code.

this file is the next layer.  it adds functionality like previous() (generators
don't have a previous() method) and wraps the results from the find.find generator,
augmenting the replace() method to update its internal copy of the code.

this is used by Document, which wraps the result again and augments replace() to
update the original code.
*/

class FindSession {
	constructor(code, startIndex, createResult) {
		this.code = code;
		this.startIndex = startIndex;
		this.createResult = createResult;
		this.currentResult = null;
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
		
		let looped = false;
		
		if (done) {
			this.generator = this.createGenerator(this.startIndex);
			
			looped = true;
			
			({
				done,
				value: result,
			} = this.generator.next());
		}
		
		this.currentResult = result;
		
		if (!result) {
			return {
				result: null,
			};
		}
		
		return {
			looped,
			result,
		};
	}
	
	previous() {
		if (!this.currentResult) {
			return {
				result: null,
			};
		}
		
		let previousIndex = find.previousIndex(this.currentResult, this.all);
		
		if (previousIndex === null) {
			return {
				result: null,
			};
		}
		
		let looped = previousIndex > this.currentResult.index;
		
		this.generator = this.createGenerator(previousIndex);
		
		return this.next();
	}
	
	getAll() {
		return [...this.createGenerator(0)];
	}
	
	*createGenerator(startIndex) {
		let {
			code,
			search,
			type,
			caseMode,
		} = this;
		
		let generator = find.find(code, search, type, caseMode, startIndex);
		
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
