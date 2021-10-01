let Cursor = require("modules/utils/Cursor");

let {c} = Cursor;

/*
sort a selection so that start is before end

(the end is the position you mouseup at for drag selections)
*/

function sort(selection) {
	let {start, end} = selection;
	
	let flip = (
		end.lineIndex < start.lineIndex
		|| end.lineIndex === start.lineIndex && end.offset < start.offset
	);
	
	if (flip) {
		let tmp = start;
		
		start = end;
		end = tmp;
	}
	
	return {start, end};
}

function isBefore(a, b) {
	let {end} = sort(a);
	let {start} = sort(b);
	
	return Cursor.isBefore(end, start) || Cursor.equals(end, start);
}

function cursorIsWithinSelection(selection, cursor) {
	let {start, end} = sort(selection);
	let {lineIndex, offset} = cursor;
	
	if (
		lineIndex < start.lineIndex
		|| lineIndex > end.lineIndex
		|| lineIndex === start.lineIndex && offset <= start.offset
		|| lineIndex === end.lineIndex && offset >= end.offset
	) {
		return false;
	}
	
	return true;
}

function isOverlapping(a, b) {
	return (
		cursorIsWithinSelection(a, b.start)
		|| cursorIsWithinSelection(a, b.end)
		|| cursorIsWithinSelection(b, a.start)
		|| cursorIsWithinSelection(b, a.end)
	);
}

function isFull(selection) {
	let {start, end} = selection;
	
	return start.lineIndex !== end.lineIndex || start.offset !== end.offset;
}

function isMultiline(selection) {
	return selection.start.lineIndex !== selection.end.lineIndex;
}

/*
adjust a selection to account for insertions/deletions earlier in the document
or overlapping with the selection (if overlapping, the result is null)

for insertions, the adjustment is a selection containing the inserted text

for deletions, the adjustment is a selection containing the deleted text

sign is 1 (insertion) or -1 (deletion)
*/

function addOrSubtractEarlierSelection(selection, adjustment, sign) {
	selection = sort(selection);
	adjustment = sort(adjustment);
	
	if (Cursor.isBefore(selection.start, adjustment.start)) {
		return selection;
	}
	
	if (
		sign === 1 && cursorIsWithinSelection(selection, adjustment.start)
		|| sign === -1 && isOverlapping(selection, adjustment)
	) {
		return null;
	}
	
	let newStartLineIndex = selection.start.lineIndex;
	let newStartOffset = selection.start.offset;
	let newEndLineIndex = selection.end.lineIndex;
	let newEndOffset = selection.end.offset;
	
	let selectionIsMultiline = isMultiline(selection);
	let adjustmentIsMultiline = isMultiline(adjustment);
	
	let linesOverlap = (
		sign === 1
		? adjustment.start.lineIndex === selection.start.lineIndex
		: adjustment.end.lineIndex === selection.start.lineIndex
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

function addOrSubtractSelection(selection, adjustment, sign) {
	let {start, end} = selection;
	
	let selectionIsMultiline = isMultiline(selection);
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

function s(start, end=null) {
	return {
		start,
		end: end || start,
	};
}

let api = {
	s,
	sort,
	isFull,
	isMultiline,
	isBefore,
	isOverlapping,
	cursorIsWithinSelection,
	
	equals(a, b) {
		a = sort(a);
		b = sort(b);
		
		return Cursor.equals(a.start, b.start) && Cursor.equals(a.end, b.end);
	},
	
	isWithin(a, b) {
		return api.cursorIsWithinOrNextToSelection(b, a.start) && api.cursorIsWithinOrNextToSelection(b, a.end);
	},
	
	charIsWithinSelection(selection, charCursor) {
		let {start, end} = sort(selection);
		let {lineIndex, offset} = charCursor;
		
		if (
			lineIndex < start.lineIndex
			|| lineIndex > end.lineIndex
			|| lineIndex === start.lineIndex && offset < start.offset
			|| lineIndex === end.lineIndex && offset >= end.offset
		) {
			return false;
		}
		
		return true;
	},
	
	cursorIsNextToSelection(selection, cursor) {
		return Cursor.equals(cursor, selection.start) || Cursor.equals(cursor, selection.end);
	},
	
	cursorIsWithinOrNextToSelection(selection, cursor) {
		return api.cursorIsNextToSelection(selection, cursor) || api.cursorIsWithinSelection(selection, cursor);
	},
	
	startOfLineContent(wrappedLines, lineIndex) {
		return s(Cursor.startOfLineContent(wrappedLines, lineIndex));
	},
	
	endOfLineContent(wrappedLines, lineIndex) {
		return s(Cursor.endOfLineContent(wrappedLines, lineIndex));
	},
	
	add(selection, addSelection) {
		return addOrSubtractSelection(selection, addSelection, 1);
	},
	
	subtract(selection, subtractSelection) {
		return addOrSubtractSelection(selection, subtractSelection, -1);
	},
	
	addEarlierSelection(selection, addSelection) {
		return addOrSubtractEarlierSelection(selection, addSelection, 1);
	},
	
	subtractEarlierSelection(selection, subtractSelection) {
		return addOrSubtractEarlierSelection(selection, subtractSelection, -1);
	},
	
	/*
	adjust a selection to account for an edit earlier in the document
	*/
	
	adjustForEarlierEdit(selection, oldSelection, newSelection) {
		selection = api.subtractEarlierSelection(selection, oldSelection);
		
		return selection && api.addEarlierSelection(selection, newSelection);
	},
	
	/*
	adjust a selection to account for an edit within the selection
	*/
	
	adjustForEditWithinSelection(selection, oldSelection, newSelection) {
		return api.add(api.subtract(selection, oldSelection), newSelection);
	},
	
	edit(selection, oldSelection, newSelection) {
		if (isBefore(oldSelection, selection)) {
			return api.adjustForEarlierEdit(selection, oldSelection, newSelection);
		} else if (api.equals(selection, oldSelection)) {
			return newSelection;
		} else if (api.isWithin(oldSelection, selection)) {
			return api.adjustForEditWithinSelection(selection, oldSelection, newSelection);
		} else if (isOverlapping(selection, oldSelection)) {
			return null;
		} else {
			return selection;
		}
	},
	
	/*
	expand a selection to include chars added at the end
	*/
	
	expand(selection, newSelection) {
		return {
			start: sort(selection).start,
			end: sort(newSelection).end,
		};
	},
	
	containString(start, str, newline) {
		let lines = str.split(newline);
		
		let endLineIndex = start.lineIndex + lines.length - 1;
		let endOffset = lines.length === 1 ? start.offset + lines[0].length : lines[lines.length - 1].length;
		
		return s(start, c(endLineIndex, endOffset));
	},
};

module.exports = api;
