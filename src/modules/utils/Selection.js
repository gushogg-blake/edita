let rowColFromCursor = require("./rowColFromCursor");

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

function up(lines, selection, selectionEndCol) {
	let {start, end} = selection;
	let [startLineIndex, startOffset] = start;
	let [endLineIndex, endOffset] = end;
	
	let [startRow, startCol] = rowColFromCursor(start);
	let [endRow, endCol] = rowColFromCursor(end);
	
	if (startRow === 0) {
		return {
			start: [0, 0],
			start: [0, 0],
		};
	}
	
	/*
	go to start line - 1, end col
	*/
	
	
}

function expandOrContractUp(lines, selection) {
	
}

module.exports = {
	sort,
	isFull,
	up,
	expandOrContractUp,
};
