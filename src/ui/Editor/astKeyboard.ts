import {selectionUtils} from "modules/astIntel";

export default {
	up() {
		this.setAstSelection(selectionUtils.up(this.document, this.astSelection));
	},
	
	down() {
		this.setAstSelection(selectionUtils.down(this.document, this.astSelection));
	},
	
	next() {
		this.setAstSelection(selectionUtils.next(this.document, this.astSelection));
	},
	
	previous() {
		this.setAstSelection(selectionUtils.previous(this.document, this.astSelection));
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
