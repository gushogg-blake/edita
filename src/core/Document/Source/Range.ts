import type {Selection, Cursor, Scope} from "core";

/*
Note - all Ranges have a .scope property. This is set by the owner
Scope after the Range is created because the injection logic creates
Ranges before creating the associated Scopes (so the Scope can't be
passed in the constructor).
*/

class Range {
	scope: Scope;
	startIndex: number;
	endIndex: number;
	selection: Selection;
	
	constructor(startIndex, endIndex, selection) {
		this.startIndex = startIndex;
		this.endIndex = endIndex;
		this.selection = selection;
	}
	
	get lang() {
		return this.scope.lang;
	}
	
	get start() {
		return this.selection.start;
	}
	
	get end() {
		return this.selection.end;
	}
	
	/*
	Note - this is different to Selection.containsCursor, where the cursor
	has to be fully inside the selection - here containsCursor is more
	permissive than containsCharCursor.
	*/
	
	containsCursor(cursor) {
		return cursor.isWithinOrNextTo(this.selection);
	}
	
	containsCharCursor(cursor) {
		return this.selection.containsCharCursor(cursor);
	}
	
	containsNodeStart(node) {
		return this.selection.containsCharCursor(node.start);
	}
	
	overlapsWithLine(lineIndex) {
		return this.start.lineIndex <= lineIndex && this.end.lineIndex >= lineIndex;
	}
}

export default Range;
