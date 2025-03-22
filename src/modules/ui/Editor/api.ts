import Selection, {s} from "modules/core/Selection";
import FindAndReplaceSession from "./FindAndReplaceSession";

export default {
	centerSelection(selection) {
		let {view} = this;
		
		let {rows} = view.sizes;
		let {rowHeight} = view.measurements;
		let [selectionRow] = view.rowColFromCursor(selection.start);
		let scrollToRow = selectionRow - Math.ceil(rows / 2);
		let scrollTop = scrollToRow * rowHeight;
		
		view.setVerticalScrollNoValidate(Math.max(0, scrollTop));
	},
	
	setNormalSelectionAndCenter(selection) {
		let {view} = this;
		
		this.setNormalSelection(selection);
		
		this.api.centerSelection(selection);
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
		
		this.applyAndAddHistoryEntry({
			edits,
		});
		
		view.validateSelection();
		
		view.setNormalHilites(edits.map(edit => edit.newSelection));
		
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
		
		let selection = this.normalSelection.sort();
		
		for (let edit of edits) {
			selection = selection.adjustForEditWithinSelection(edit.selection, edit.newSelection);
			
			if (!selection) {
				selection = this.normalSelection;
				
				break;
			}
		}
		
		this.applyAndAddHistoryEntry({
			edits,
			normalSelection: selection,
		});
		
		view.validateSelection(); // MIGRATE move to view
		
		view.setNormalHilites(edits.map(edit => edit.newSelection));
		
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
		
		this.view.ensureScrollIsWithinBounds();
	},
	
	setNormalHilites(selections, clearAfter=null) {
		this.view.setNormalHilites(selections);
		
		if (clearAfter !== null) {
			setTimeout(() => {
				this.api.setNormalHilites([]);
			}, clearAfter);
		}
	},
};
