module.exports = {
	setSelection(selection) {
		this.view.normalSelection = selection;
		this.view.updateSelectionEndCol();
	},
};
