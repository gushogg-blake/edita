module.exports = {
	setSelection(selection) {
		this.view.setAstSelection(selection);
		this.view.redraw();
	},
	
	setSelectionHilite(selection) {
		this.view.astSelectionHilite = selection;
		
		this.view.showPickOptionsFor(selection);
		
		this.view.redraw();
	},
	
	setInsertionHilite(selection) {
		this.view.astInsertionHilite = selection;
	},
};
