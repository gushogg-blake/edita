let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");

let {s} = Selection;
let {c} = Cursor;

module.exports = {
	drawSelection(selection) {
		this.view.normalSelection = selection;
	},
	
	finishDrawingSelection() {
		this.setSelectionFromNormalMouse(this.view.normalSelection);
	},
	
	setSelectionAndStartCursorBlink(selection) {
		this.setSelectionFromNormalMouse(selection);
		
		this.view.startCursorBlink();
		this.view.redraw();
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
		
		this.applyAndAddHistoryEntry({
			edits: [edit],
			normalSelection: newSelection,
		});
		
		this.view.startCursorBlink();
		this.view.redraw();
	},
	
	drop(cursor, str, move, fromUs, toUs) {
		let {normalSelection: selection} = this.view;
		
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
			} = this.document.move(selection, cursor));
		} else {
			let edit = this.document.replaceSelection(Selection.s(cursor), str);
			
			edits = [edit.edit];
			newSelection = this.document.getSelectionContainingString(cursor, str);
		}
		
		this.applyAndAddHistoryEntry({
			edits,
			normalSelection: newSelection,
		});
		
		this.view.insertCursor = null;
		this.view.startCursorBlink();
		this.view.redraw();
	},
};
