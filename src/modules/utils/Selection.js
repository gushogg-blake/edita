let Cursor = require("./Cursor");

/*
sort a selection so that start is before end

(the end is the position you mouseup at for drag selections)
*/

function sort(selection) {
	let {start, end} = selection;
	let [startLineIndex, startOffset] = start;
	let [endLineIndex, endOffset] = end;
	
	let flip = (
		endLineIndex < startLineIndex
		|| endLineIndex === startLineIndex && endOffset < startOffset
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
	
	return start[0] !== end[0] || start[1] !== end[1];
}

function isMultiline(selection) {
	let {start, end} = selection;
	
	return start[0] !== end[0];
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
		let [startLineIndex, startOffset] = start;
		let [endLineIndex, endOffset] = end;
		let [lineIndex, offset] = cursor;
		
		if (
			lineIndex < startLineIndex
			|| lineIndex > endLineIndex
			|| lineIndex === startLineIndex && offset <= startOffset
			|| lineIndex === endLineIndex && offset >= endOffset
		) {
			return false;
		}
		
		return true;
	},
	
	charIsWithinSelection(selection, charCursor) {
		let {start, end} = sort(selection);
		let [startLineIndex, startOffset] = start;
		let [endLineIndex, endOffset] = end;
		let [lineIndex, offset] = charCursor;
		
		if (
			lineIndex < startLineIndex
			|| lineIndex > endLineIndex
			|| lineIndex === startLineIndex && offset < startOffset
			|| lineIndex === endLineIndex && offset >= endOffset
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
};

module.exports = api;
