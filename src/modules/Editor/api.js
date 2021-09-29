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
	},
	
	findAll(options) {
		let results = this.document.findAll(options);
		
		this.view.normalHilites = results.map(result => result.selection);
		
		this.view.redraw();
		
		return results;
	},
	
	findAllInSelectedText(options) {
		let {document, view} = this;
		let {start, end} = view.getNormalSelectionForFind();
		
		let results = document.findAll({
			...options,
			startIndex: document.indexFromCursor(start),
			endIndex: document.indexFromCursor(end),
		});
		
		view.normalHilites = results.map(result => result.selection);
		
		view.redraw();
		
		return results;
	},
	
	replaceAll(options) {
		let {document, view} = this;
		
		let {edits, results} = document.replaceAll(options);
		
		this.applyAndAddHistoryEntry({
			edits,
		});
		
		view.normalHilites = edits.map(edit => edit.newSelection);
		
		view.redraw();
		
		return results;
	},
	
	replaceAllInSelectedText(options) {
		let {document, view} = this;
		let {start, end} = view.getNormalSelectionForFind();
		
		let {edits, results} = document.replaceAll({
			...options,
			startIndex: document.indexFromCursor(start),
			endIndex: document.indexFromCursor(end),
		});
		
		this.applyAndAddHistoryEntry({
			edits,
		});
		
		view.normalHilites = edits.map(edit => edit.newSelection);
		
		view.redraw();
		
		return results;
	},
};
