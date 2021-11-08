let Selection = require("modules/utils/Selection");
let findAndReplace = require("modules/findAndReplace");

/*
functions to control the editor from outside, e.g. to set the selection when
viewing a find result.  these functions will do any necessary redraws, making
sure the selection is on screen etc (the underlying methods don't do that to
avoid doing it unnecessarily)
*/

module.exports = {
	setNormalSelectionAndCenter(selection) {
		let {view} = this;
		
		view.startBatch();
		
		this.setNormalSelection(selection);
		
		let {rows} = view.sizes;
		let {rowHeight} = view.measurements;
		let [selectionRow] = view.rowColFromCursor(selection.start);
		let scrollToRow = selectionRow - Math.ceil(rows / 2);
		let scrollTop = scrollToRow * rowHeight;
		
		view.setVerticalScrollNoValidate(scrollTop);
		
		view.endBatch();
	},
	
	findAll(options) {
		let results = this.document.findAll(options);
		
		this.view.setNormalHilites(results.map(result => result.selection));
		
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
		
		view.setNormalHilites(results.map(result => result.selection));
		
		return results;
	},
	
	replaceAll(options) {
		let {document, view} = this;
		let {edits, results} = document.replaceAll(options);
		
		view.startBatch();
		
		this.applyAndAddHistoryEntry({
			edits,
		});
		
		//this.validateSelection(); // TODO not sure if needed
		
		view.setNormalHilites(edits.map(edit => edit.newSelection));
		
		view.endBatch();
		
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
		
		let selection = Selection.sort(this.normalSelection);
		
		for (let edit of edits) {
			selection = Selection.adjustForEditWithinSelection(selection, edit.selection, edit.newSelection);
			
			if (!selection) {
				selection = this.normalSelection;
				
				break;
			}
		}
		
		view.startBatch();
		
		this.applyAndAddHistoryEntry({
			edits,
			normalSelection: selection,
		});
		
		view.setNormalHilites(edits.map(edit => edit.newSelection));
		
		view.endBatch();
		
		return results;
	},
};
