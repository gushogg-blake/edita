import Selection, {s} from "core/Selection";
import Cursor, {c} from "core/Cursor";

export default {
	drawSelection(selection) {
		this.view.setNormalSelection(selection, {
			updateAstSelection: false,
		});
	},
	
	drawDoubleClickSelection(origWordSelection, cursor) {
		let wordUnderCursor = this.view.Selection.wordUnderCursor(cursor);
		let newSelection;
		
		if (wordUnderCursor.isBefore(origWordSelection)) {
			newSelection = s(origWordSelection.right, wordUnderCursor.left);
		} else {
			newSelection = s(origWordSelection.left, wordUnderCursor.right);
		}
		
		this.view.setNormalSelection(newSelection, {
			updateAstSelection: false,
		});
	},
	
	finishDrawingSelection() {
		this.setSelectionFromNormalMouse(this.view.normalSelection);
	},
	
	updateAstSelection() {
		this.view.updateAstSelectionFromNormalSelection();
	},
	
	setSelectionAndStartCursorBlink(selection) {
		let {view} = this;
		
		this.setSelectionFromNormalMouse(selection, {
			updateAstSelection: false,
		});
		
		view.startCursorBlink();
	},
	
	async insertSelectionClipboard(cursor) {
		let str = await platform.clipboard.readSelection();
		
		let {
			edit,
			newSelection,
		} = this.document.replaceSelection(s(cursor), str);
		
		let {view} = this;
		
		this.applyAndAddHistoryEntry({
			edits: [edit],
			normalSelection: newSelection,
		});
		
		view.startCursorBlink();
	},
	
	drop(cursor, str, move, fromUs, toUs) {
		let {document, view} = this;
		let {normalSelection: selection} = view;
		
		if (move && fromUs) {
			if (cursor.isWithinOrNextTo(selection)) {
				return;
			}
		} else {
			if (cursor.isWithin(selection)) {
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
			let edit = document.replaceSelection(s(cursor), str);
			
			edits = [edit.edit];
			newSelection = document.getSelectionContainingString(cursor, str);
		}
		
		this.applyAndAddHistoryEntry({
			edits,
			normalSelection: newSelection,
		});
		
		view.setInsertCursor(null);
		view.startCursorBlink();
	},
};
