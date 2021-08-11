let Cursor = require("./Cursor");

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

// is a before b (and not overlapping)?

function isBefore(a, b) {
	let {end} = sort(a);
	let {start} = sort(b);
	
	return Cursor.isBefore(end, start);
}

function isFull(selection) {
	let {start, end} = selection;
	
	return start.lineIndex !== end.lineIndex || start.offset !== end.offset;
}

function isMultiline(selection) {
	return selection.start.lineIndex !== selection.end.lineIndex;
}

function isOverlapping(a, b) {
	
}

/*
adjust a selection to account for insertions/deletions earlier in the document

for insertions, the adjustment is a selection containing the inserted text

for deletions, the adjustment is a selection containing the deleted text

sign is 1 (insertion) or -1 (deletion)
*/

function adjustSelection(selection, adjustment, sign) {
	selection = sort(selection);
	adjustment = sort(adjustment);
	
	if (Cursor.isBefore(selection.start, adjustment.start)) {
		return selection;
	}
	
	let newStartLineIndex = selection.start.lineIndex;
	let newStartOffset = selection.start.offset;
	let newEndLineIndex = selection.end.lineIndex;
	let newEndOffset = selection.end.offset;
	
	if (adjustment.start.lineIndex === selection.start.lineIndex) {
		let adjustOffset = (adjustment.end.offset - adjustment.start.offset) * sign;
		
		newStartOffset += adjustOffset;
		
		if (selection.end.lineIndex === selection.start.lineIndex) {
			newEndOffset += adjustOffset;
		}
	} else {
		let adjustLineIndex = (adjustment.end.lineIndex - adjustment.start.lineIndex) * sign;
		
		newStartLineIndex += adjustLineIndex;
		newEndLineIndex += adjustLineIndex;
		
		if (adjustment.end.lineIndex === selection.start.lineIndex) {
			let adjustOffset = adjustment.end.offset * sign;
			
			newStartOffset += adjustOffset;
			
			if (selection.end.lineIndex === selection.start.lineIndex) {
				newEndOffset += adjustOffset;
			}
		}
	}
	
	return s(c(newStartLineIndex,newStartOffset), c(newEndLineIndex, newEndOffset));
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
	
	cursorIsWithinSelection(selection, cursor) {
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
	
	isOverlapping(a, b) {
		return (
			api.cursorIsWithinSelection(a, b.start)
			|| api.cursorIsWithinSelection(a, b.end)
			|| api.cursorIsWithinSelection(b, a.start)
			|| api.cursorIsWithinSelection(b, a.end)
		);
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
	
	containString(start, str, newline) {
		let lines = str.split(newline);
		
		let endLineIndex = start.lineIndex + lines.length - 1;
		let endOffset = lines.length === 1 ? start.offset + lines[0].length : lines[lines.length - 1].length;
		
		return s(start, c(endLineIndex, endOffset));
	},
};

module.exports = api;
