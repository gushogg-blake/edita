let Selection = require("modules/Selection");
let treeSitterPointToCursor = require("modules/utils/treeSitter/treeSitterPointToCursor");

/*
Note - all Ranges have a .scope property. This is set by the owner
Scope after the Range is created because the injection logic creates
Ranges before creating the associated Scopes (so the Scope can't be
passed in the constructor).
*/

class Range {
	constructor(startIndex, endIndex, selection) {
		this.startIndex = startIndex;
		this.endIndex = endIndex;
		this.selection = selection;
	}
	
	get lang() {
		return this.scope.lang;
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
		return this.selection.containsCharCursor(treeSitterPointToCursor(node.startPosition));
	}
	
	toTreeSitterRange() {
		let {
			startIndex,
			endIndex,
			selection,
		} = this;
		
		return {
			startIndex,
			endIndex,
			
			startPosition: {
				row: selection.start.lineIndex,
				column: selection.start.offset,
			},
			
			endPosition: {
				row: selection.end.lineIndex,
				column: selection.end.offset,
			},
		};
	}
	
	static toTreeSitterRange(range) {
		return range.toTreeSitterRange();
	}
}

module.exports = Range;
