let treeSitterPointToCursor = require("modules/utils/treeSitter/treeSitterPointToCursor");
let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");

let {s} = Selection;
let {c} = Cursor;

function selectionFromNode(node) {
	let {startPosition, endPosition} = node;
	
	return s(c(startPosition.row, startPosition.column), c(endPosition.row, endPosition.column));
}

/*
Note - all Ranges have a .scope property. This is set by the owner
Scope after the Range is created because the injection logic creates
Ranges before creating the associated Scopes (so the Scope can't be
passed in the constructor).
*/

class Range {
	constructor(node, startIndex, endIndex, selection) {
		this.node = node;
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
	
	static fromNode(node) {
		let {
			startIndex,
			endIndex,
		} = node;
		
		return new Range(
			node,
			startIndex,
			endIndex,
			selectionFromNode(node),
		);
	}
}

module.exports = Range;
