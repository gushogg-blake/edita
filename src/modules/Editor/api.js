let Selection = require("modules/utils/Selection");
let FindAndReplaceSession = require("./FindAndReplaceSession");

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
		
		view.setVerticalScrollNoValidate(Math.max(0, scrollTop));
		
		view.endBatch();
	},
	
	findAndReplace(options) {
		return new FindAndReplaceSession(this, options);
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
			rangeStartIndex: document.indexFromCursor(start),
			rangeEndIndex: document.indexFromCursor(end),
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
		
		view.validateSelection();
		
		view.setNormalHilites(edits.map(edit => edit.newSelection));
		
		view.endBatch();
		
		return results;
	},
	
	replaceAllInSelectedText(options) {
		let {document, view} = this;
		let {start, end} = view.getNormalSelectionForFind();
		
		let {edits, results} = document.replaceAll({
			...options,
			rangeStartIndex: document.indexFromCursor(start),
			rangeEndIndex: document.indexFromCursor(end),
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
		
		view.validateSelection();
		
		view.setNormalHilites(edits.map(edit => edit.newSelection));
		
		view.endBatch();
		
		return results;
	},
	
	edit(selection, replaceWith) {
		let {
			edit,
			newSelection,
		} = this.document.replaceSelection(selection, replaceWith);
		
		let edits = [edit];
		
		this.applyAndAddHistoryEntry({
			edits,
			normalSelection: newSelection,
			snippetSession: this.adjustSnippetSession(edits),
		});
	},
	
	setNormalHilites(selections) {
		this.view.setNormalHilites(selections);
	},
};
