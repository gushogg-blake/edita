import {Selection, s} from "core";
import type {Editor} from "ui/editor";
import FindAndReplaceSession from "./FindAndReplaceSession";

/*
Editor has public methods but they may require you to know what
you're doing -- this is more of a publicly-consumable API where
you can treat the editor as more of a black box and assume that
it will take care of any necessary logic to get the job done.
*/

export default class EditorApi {
	private editor: Editor;
	
	constructor(editor: Editor) {
		this.editor = editor;
	}
	
	private get view() {
		return this.editor.view;
	}
	
	private get document() {
		return this.editor.document;
	}
	
	centerSelection(selection: Selection) {
		let {view} = this;
		
		let {rows} = view.sizes;
		let {rowHeight} = view.measurements;
		let {row: selectionRow} = view.canvasUtils.rowColFromCursor(selection.start);
		let scrollToRow = selectionRow - Math.ceil(rows / 2);
		let scrollTop = scrollToRow * rowHeight;
		
		view.setVerticalScrollNoValidate(Math.max(0, scrollTop));
	}
	
	setNormalSelectionAndCenter(selection: Selection): void {
		this.editor.setNormalSelection(selection);
		
		this.centerSelection(selection);
	}
	
	findAndReplace(options) {
		return new FindAndReplaceSession(this.editor, options);
	}
	
	findAll(options) {
		let results = this.document.findAll(options);
		
		this.view.setNormalHilites(results.map(result => result.selection));
		
		return results;
	}
	
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
	}
	
	replaceAll(options) {
		let {editor, document, view} = this;
		let {edits, results} = document.replaceAll(options);
		
		editor.applyAndAddHistoryEntry({
			edits,
		});
		
		view.validateSelection();
		
		view.setNormalHilites(edits.map(edit => edit.newSelection));
		
		return results;
	}
	
	replaceAllInSelectedText(options) {
		let {editor, document, view} = this;
		let {start, end} = view.getNormalSelectionForFind();
		
		let {edits, results} = document.replaceAll({
			...options,
			rangeStartIndex: document.indexFromCursor(start),
			rangeEndIndex: document.indexFromCursor(end),
		});
		
		let selection = editor.normalSelection.sort();
		
		for (let edit of edits) {
			selection = selection.adjustForEditWithinSelection(edit.selection, edit.newSelection);
			
			if (!selection) {
				selection = editor.normalSelection;
				
				break;
			}
		}
		
		editor.applyAndAddHistoryEntry({
			edits,
			normalSelection: selection,
		});
		
		view.validateSelection(); // MIGRATE move to view
		
		view.setNormalHilites(edits.map(edit => edit.newSelection));
		
		return results;
	}
	
	edit(selection: Selection, replaceWith: string): void {
		let {editor, view} = this;
		
		let {
			edits,
			newSelection,
		} = editor.replaceSelection(selection, replaceWith);
		
		editor.applyAndAddHistoryEntry({
			edits,
			normalSelection: newSelection,
			snippetSession: editor.adjustSnippetSession(edits),
		});
		
		view.ensureScrollIsWithinBounds(); // MIGRATE view should probs do this itself
	}
	
	setNormalHilites(selections: Selection[], clearAfterMs: number = null) {
		this.view.setNormalHilites(selections);
		
		if (clearAfterMs !== null) {
			setTimeout(() => {
				this.setNormalHilites([]);
			}, clearAfterMs);
		}
	}
}
