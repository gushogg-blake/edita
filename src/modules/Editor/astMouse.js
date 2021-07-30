module.exports = {
	setSelectionHilite(selection) {
		this.view.astSelectionHilite = selection;
		
		//let {lines} = this.document;
		let {codeIntel} = this.document.lang;
		
		if (selection) {
			this.view.showPickOptionsFor(selection);
		} else {
			this.view.showPickOptionsFor(null);
		}
		
		this.view.redraw();
	},
};
