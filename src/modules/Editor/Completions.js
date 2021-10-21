module.exports = class {
	constructor() {
		this.active = false;
		this.selectedCompletion = null;
		this.completions = [];
	}
	
	clear() {
		this.active = false;
		this.selectedCompletion = null;
		this.completions = [];
	}
	
	show(completions) {
		this.completions = completions;
		
		if (this.completions.length > 0) {
			this.active = true;
			this.selectedCompletion = completions[0];
		} else {
			this.clear();
		}
	}
}
