module.exports = {
	setSelection(selection) {
		this.view.setNormalSelection(selection);
		this.view.updateSelectionEndCol();
	},
};
