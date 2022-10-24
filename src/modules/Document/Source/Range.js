let Selection = require("modules/utils/Selection");
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
	
	containsCursor(cursor) {
		return Selection.cursorIsWithinOrNextToSelection(this.selection, cursor);
	}
	
	containsCharCursor(cursor) {
		return Selection.charIsWithinSelection(this.selection, cursor);
	}
	
	containsNodeStart(node) {
		return Selection.charIsWithinSelection(this.selection, treeSitterPointToCursor(node.startPosition));
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
