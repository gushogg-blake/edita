import type Edit from "./Edit";

export default class HistoryEntry {
	redo: Edit[];
	undo: Edit[];
	
	constructor(edits: Edit[]) {
		this.redo = edits;
		this.undo = HistoryEntry.reverseEdits(edits);
	}
	
	merge(edits) {
		this.redo = [...this.redo, ...edits];
		this.undo = [...HistoryEntry.reverseEdits(edits), ...this.undo];
	}
	
	private static reverseEdits(edits: Edit[]): Edit[] {
		return [...edits].reverse().map(edit => edit.reverse());
	}
}
