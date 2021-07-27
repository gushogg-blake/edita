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

function isFull(selection) {
	let {start, end} = selection;
	
	return start[0] !== end[0] || start[1] !== end[1];
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
	
	cursorIsWithinSelection(selection, cursor) {
		let {start, end} = sort(selection);
		let [startLineIndex, startOffset] = start;
		let [endLineIndex, endOffset] = end;
		let [lineIndex, offset] = cursor;
		
		if (
			lineIndex < startLineIndex
			|| lineIndex > endLineIndex
			|| lineIndex === startLineIndex && offset < startOffset
			|| lineIndex === endLineIndex && offset > endOffset
		) {
			return false;
		}
		
		return true;
	},
};

module.exports = api;
