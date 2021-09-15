let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");

let {s} = Selection;
let {c} = Cursor;

function selectionFromNode(node) {
	let {
		startPosition,
		endPosition,
	} = node;
	
	return s(c(startPosition.row, startPosition.column), c(endPosition.row, endPosition.column));
}

class Range {
	constructor(node, startIndex, endIndex, selection) {
		this.node = node;
		this.startIndex = startIndex;
		this.endIndex = endIndex;
		this.selection = selection;
	}
	
	containsNode(node) {
		return Selection.isWithin(selectionFromNode(node), this.selection);
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
