module.exports = {
	setSelection(selection) {
		this.view.astSelection = selection;
		
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
	
	pick(selection) {
		this.view.astSelection = selection;
	},
};
