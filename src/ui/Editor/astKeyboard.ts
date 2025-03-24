import astCommon from "modules/astCommon";

export default {
	up() {
		this.setAstSelection(astCommon.selection.up(this.document, this.view.astSelection));
	},
	
	down() {
		this.setAstSelection(astCommon.selection.down(this.document, this.view.astSelection));
	},
	
	next() {
		this.setAstSelection(astCommon.selection.next(this.document, this.view.astSelection));
	},
	
	previous() {
		this.setAstSelection(astCommon.selection.previous(this.document, this.view.astSelection));
	},
	
	insertAtEnd() {
		
	},
	
	insertAtBeginning() {
	},
	
	insertBefore() {
		
	},
	
	insertAfter() {
		
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
	
	comment() {
		this.commonKeyboard.toggleComment(true);
	},
	
	uncomment() {
		this.commonKeyboard.toggleComment(false);
	},
};
