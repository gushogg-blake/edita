let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");

let {s} = Selection;
let {c} = Cursor;

module.exports = {
	drawSelection(selection) {
		this.view.setNormalSelection(selection);
	},
	
	finishDrawingSelection() {
		this.setSelectionFromNormalMouse(this.view.normalSelection);
	},
	
	setSelectionAndStartCursorBlink(selection) {
		let {view} = this;
		
		view.startBatch();
		
		this.setSelectionFromNormalMouse(selection);
		
		view.startCursorBlink();
		
		view.endBatch();
		
		console.log("setSelectionFromNormalMouse", view.batchDepth);
	},
	
	setSelectionClipboard() {
		platform.clipboard.writeSelection(this.getSelectedText());
	},
	
	async insertSelectionClipboard(cursor) {
		let str = await platform.clipboard.readSelection();
		
		let {
			edit,
			newSelection,
		} = this.document.replaceSelection(Selection.s(cursor), str);
		
		let {view} = this;
		
		view.startBatch();
		
		this.applyAndAddHistoryEntry({
			edits: [edit],
			normalSelection: newSelection,
		});
		
		view.startCursorBlink();
		
		view.endBatch();
	},
	
	drop(cursor, str, move, fromUs, toUs) {
		let {document, view} = this;
		let {normalSelection: selection} = view;
		
		if (move && fromUs) {
			if (Selection.cursorIsWithinOrNextToSelection(selection, cursor)) {
				return;
			}
		} else {
			if (Selection.cursorIsWithinSelection(selection, cursor)) {
				return;
			}
		}
		
		let edits;
		let newSelection;
		
		if (move && fromUs) {
			({
				edits,
				newSelection,
			} = document.move(selection, cursor));
		} else {
			let edit = document.replaceSelection(Selection.s(cursor), str);
			
			edits = [edit.edit];
			newSelection = document.getSelectionContainingString(cursor, str);
		}
		
		view.startBatch();
		
		this.applyAndAddHistoryEntry({
			edits,
			normalSelection: newSelection,
		});
		
		view.setInsertCursor(null);
		view.startCursorBlink();
		
		view.endBatch();
	},
};
