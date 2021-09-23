/*
functions to control the editor from outside, e.g. to set the selection when
viewing a find result.  these functions will do any necessary redraws, making
sure the selection is on screen etc (the underlying methods don't do that to
avoid doing it unnecessarily)
*/

module.exports = {
	setNormalSelectionAndCenter(selection) {
		this.setNormalSelection(selection);
		
		
		let {rows} = this.view.sizes;
		
		let [selectionRow] = this.view.rowColFromCursor(selection.start);
		
		let scrollToRow = selectionRow - Math.ceil(rows / 2);
		
		this.view.setVerticalScroll(scrollToRow);
		this.view.redraw();
		//console.log(this.view);
	},
};
