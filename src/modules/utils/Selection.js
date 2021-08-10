let Cursor = require("./Cursor");

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
		selection = sort(selection);
		addSelection = sort(addSelection);
		
		if (isBefore(selection, addSelection)) {
			return selection;
		}
		
		
		
		
	},
	
	subtract(selection, subtractSelection) {
	},
};

module.exports = api;
