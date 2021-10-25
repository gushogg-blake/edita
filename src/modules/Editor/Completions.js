module.exports = class {
	constructor() {
		this.active = false;
		this.cursor = null;
		this.completions = [];
		this.selectedCompletion = null;
	}
	
	clear() {
		this.active = false;
		this.cursor = null;
		this.completions = [];
		this.selectedCompletion = null;
	}
	
	show(cursor, completions) {
		this.active = true;
		this.cursor = cursor;
		this.completions = completions;
		this.selectedCompletion = completions[0];
	}
}
