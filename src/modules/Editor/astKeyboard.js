module.exports = {
	up() {
		this.setAstSelection(this.document.lang.astMode.selection.up(this.document.lines, this.view.astSelection));
	},
	
	down() {
		this.setAstSelection(this.document.lang.astMode.selection.down(this.document.lines, this.view.astSelection));
	},
	
	next() {
		this.setAstSelection(this.document.lang.astMode.selection.next(this.document.lines, this.view.astSelection));
	},
	
	previous() {
		this.setAstSelection(this.document.lang.astMode.selection.previous(this.document.lines, this.view.astSelection));
	},
	
	insert() {
		
	},
	
	expandUp() {
		
	},
	
	expandDown() {
		
	},
	
	contractUp() {
	},
	
	contractDown() {
	},
	
	collapseUp() {
	},
	
	collapseDown() {
		
	},
	
	/*
	select the current selection
	
	useful for going to the end of a block selection, e.g. to insert after a
	block, and as a no-op for enabling native drag when peeking AST mode, which
	requires a key press
	*/
	
	selectSelection() {
		this.setAstSelection(this.view.astSelection);
	},
	
	pageUp() {
		this.scrollPageUp();
	},
	
	pageDown() {
		this.scrollPageDown();
	},
	
	toggleSpaceAbove() {
		console.log("toggle space above");
	},
	
	toggleSpaceBelow() {
		console.log("toggle space below");
	},
};
