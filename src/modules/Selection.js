let Cursor = require("modules/Cursor");

let {c} = Cursor;

function s(start, end=null) {
	return new Selection(start, end);
}

class Selection {
	constructor(start, end) {
		this.start = start;
		this.end = end || start;
	}
	
	get left() {
		return Cursor.min(this.start, this.end);
	}
	
	get right() {
		return Cursor.max(this.start, this.end);
	}
	
	/*
	equals doesn't check the direction, only the the selection covers the
	same span of chars
	*/
	
	equals(selection) {
		return selection.left.equals(this.left) && selection.right.equals(this.right);
	}
	
	sort() {
		return Selection.sort(this);
	}
	
	containsCursor(cursor) {
		return cursor.isWithin(this);
	}
	
	containsCharCursor(cursor) {
		return cursor.charIsWithin(this);
	}
	
	intersection(selection) {
		return intersection(this, selection);
	}
	
	isFull() {
		let {start, end} = this;
		
		return start.lineIndex !== end.lineIndex || start.offset !== end.offset;
	}
	
	isMultiline() {
		return this.start.lineIndex !== this.end.lineIndex;
	}
	
	isBefore(selection) {
		return this.right.isOnOrBefore(selection.left);
	}
	
	partiallyOverlaps(selection) {
		return (
			this.containsCursor(selection.start)
			|| this.containsCursor(selection.end)
			|| selection.containsCursor(this.start)
			|| selection.containsCursor(this.end)
		);
	}
	
	overlaps(selection) {
		return this.partiallyOverlaps(selection) || this.equals(selection);
	}
	
	//isWithin(selection) {
	//	return selection.contains(this);
	//}
	
	contains(selection) {
		let {start, end} = selection;
		
		return start.isWithinOrNextTo(this) && end.isWithinOrNextTo(this);
	}
	
	add(addSelection) {
		return this.addOrSubtractSelection(addSelection, 1);
	}
	
	subtract(subtractSelection) {
		return this.addOrSubtractSelection(subtractSelection, -1);
	}
	
	addEarlierSelection(addSelection) {
		return addOrSubtractEarlierSelection(this, addSelection, 1);
	}
	
	subtractEarlierSelection(subtractSelection) {
		return addOrSubtractEarlierSelection(this, subtractSelection, -1);
	}
	
	/*
	adjust to account for an edit earlier in the document
	*/
	
	adjustForEarlierEdit(oldSelection, newSelection) {
		return this.subtractEarlierSelection(oldSelection)?.addEarlierSelection(newSelection);
	}
	
	/*
	adjust to account for an edit within the selection
	*/
	
	adjustForEditWithinSelection(oldSelection, newSelection) {
		return this.subtract(oldSelection).add(newSelection);
	}
	
	edit(oldSelection, newSelection) {
		if (oldSelection.isBefore(this)) {
			return this.adjustForEarlierEdit(oldSelection, newSelection);
		} else if (this.equals(oldSelection)) {
			return newSelection;
		} else if (this.contains(oldSelection)) {
			return this.adjustForEditWithinSelection(oldSelection, newSelection);
		} else if (this.partiallyOverlaps(oldSelection)) {
			return null;
		} else {
			return this;
		}
	}
	
	/*
	expand a selection to include chars added at the end
	*/
	
	expand(newSelection) {
		return {
			start: this.left,
			end: newSelection.right,
		};
	}
	
	/*
	adjust a selection to account for insertions/deletions earlier in the document
	or overlapping with the selection (if overlapping, the result is null)
	
	for insertions, the adjustment is a selection containing the inserted text
	
	for deletions, the adjustment is a selection containing the deleted text
	
	sign is 1 (insertion) or -1 (deletion)
	*/
	
	addOrSubtractEarlierSelection(adjustment, sign) {
		adjustment = adjustment.sort();
		
		let {start, end} = this.sort();
		
		if (start.isBefore(adjustment.start)) {
			return this;
		}
		
		if (
			sign === 1 && this.containsCursor(adjustment.start)
			|| sign === -1 && this.partiallyOverlaps(adjustment)
		) {
			return null;
		}
		
		let newStartLineIndex = start.lineIndex;
		let newStartOffset = start.offset;
		let newEndLineIndex = end.lineIndex;
		let newEndOffset = end.offset;
		
		let selectionIsMultiline = selection.isMultiline();
		let adjustmentIsMultiline = adjustment.isMultiline();
		
		let linesOverlap = (
			sign === 1
			? adjustment.start.lineIndex === start.lineIndex
			: adjustment.end.lineIndex === start.lineIndex
		);
		
		let adjustmentLines = adjustment.end.lineIndex - adjustment.start.lineIndex;
		
		if (adjustmentIsMultiline) {
			let adjustLineIndex = (linesOverlap ? adjustmentLines : adjustmentLines) * sign;
			
			newStartLineIndex += adjustLineIndex;
			newEndLineIndex += adjustLineIndex;
		}
		
		if (linesOverlap) {
			let adjustOffset = (adjustment.end.offset - adjustment.start.offset) * sign;
			
			newStartOffset += adjustOffset;
			
			if (!selectionIsMultiline) {
				newEndOffset += adjustOffset;
			}
		}
		
		return s(c(newStartLineIndex, newStartOffset), c(newEndLineIndex, newEndOffset));
	}
	
	addOrSubtractSelection(adjustment, sign) {
		let {start, end} = this;
		
		let selectionIsMultiline = this.isMultiline();
		let adjustmentHeightDiff = adjustment.end.lineIndex - adjustment.start.lineIndex;
		
		if (adjustment.start.lineIndex === start.lineIndex && adjustment.end.lineIndex === end.lineIndex) {
			if (selectionIsMultiline) {
				return s(
					start,
					c(end.lineIndex + adjustmentHeightDiff * sign, end.offset + adjustment.end.offset * sign),
				);
			} else {
				return s(
					start,
					c(end.lineIndex, end.offset + (adjustment.end.offset - adjustment.start.offset) * sign),
				);
			}
		} else if (adjustment.start.lineIndex === start.lineIndex) {
			return s(
				start,
				c(end.lineIndex + adjustmentHeightDiff * sign, end.offset),
			);
		} else if (adjustment.end.lineIndex === end.lineIndex) {
			return s(
				start,
				c(end.lineIndex + adjustmentHeightDiff * sign, end.offset + adjustment.end.offset * sign),
			);
		} else {
			return s(
				start,
				c(end.lineIndex + adjustmentHeightDiff * sign, end.offset),
			);
		}
	}
	
	static s = s;
	
	/*
	sort a selection so that start is before end
	
	(the end is the position you mouseup at for drag selections)
	*/
	
	static sort(selection) {
		return s(selection.left, selection.right);
	}
	
	static intersection(a, b) {
		let start = Cursor.max(a.left, b.left);
		let end = Cursor.min(a.right, b.right);
		
		return start.isBefore(end) ? s(start, end) : null;
	}
	
	static containString(start, str, newline) {
		let lines = str.split(newline);
		
		let endLineIndex = start.lineIndex + lines.length - 1;
		let endOffset = lines.length === 1 ? start.offset + lines[0].length : lines.at(-1).length;
		
		return s(start, c(endLineIndex, endOffset));
	}
	
	static start() {
		return s(Cursor.start());
	}
	
	static startOfLineContent(wrappedLines, lineIndex) {
		return s(Cursor.startOfLineContent(wrappedLines, lineIndex));
	}
	
	static endOfLineContent(wrappedLines, lineIndex) {
		return s(Cursor.endOfLineContent(wrappedLines, lineIndex));
	}
}

module.exports = Selection;
