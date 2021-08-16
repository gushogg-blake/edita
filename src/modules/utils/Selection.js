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
	return Cursor.isBefore(sort(a).end, sort(b).start);
}

function startsBefore(a, b) {
	return Cursor.isBefore(sort(a).start, sort(b).start);
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

function adjustSelection(selection, adjustment, sign) {
	selection = sort(selection);
	adjustment = sort(adjustment);
	
	if (
		sign === 1 && cursorIsWithinSelection(selection, adjustment.start)
		|| sign === -1 && isOverlapping(selection, adjustment)
	) {
		return null;
	}
	
	if (startsBefore(selection, adjustment)) {
		return selection;
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
	
	equals(a, b) {
		a = sort(a);
		b = sort(b);
		
		return Cursor.equals(a.start, b.start) && Cursor.equals(a.end, b.end);
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
		return adjustSelection(selection, addSelection, 1);
	},
	
	subtract(selection, subtractSelection) {
		return adjustSelection(selection, subtractSelection, -1);
	},
	
	adjust(selection, subtractSelection, addSelection) {
		selection = api.subtract(selection, subtractSelection);
		
		return selection && api.add(selection, addSelection);
	},
	
	containString(start, str, newline) {
		let lines = str.split(newline);
		
		let endLineIndex = start.lineIndex + lines.length - 1;
		let endOffset = lines.length === 1 ? start.offset + lines[0].length : lines[lines.length - 1].length;
		
		return s(start, c(endLineIndex, endOffset));
	},
};

module.exports = api;
