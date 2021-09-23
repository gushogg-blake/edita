let Evented = require("utils/Evented");

class FindResults extends Evented {
	constructor() {
		super();
		
		this.results = [];
		this.index = null;
	}
	
	add(results) {
		this.results.push(results);
		this.index = this.results.length - 1;
		
		this.fire("resultsAdded");
	}
	
	forward() {
		if (this.index === null || this.index === this.results.length - 1) {
			return;
		}
		
		this.index++;
		
		this.fire("nav");
	}
	
	back() {
		if (this.index === null || this.index === 0) {
			return;
		}
		
		this.index--;
		
		this.fire("nav");
	}
	
	get currentResults() {
		return this.index !== null ? this.results[this.index] : null;
	}
}

module.exports = FindResults;
