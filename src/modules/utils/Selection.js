let rowColFromCursor = require("./rowColFromCursor");
let cursorFromRowCol = require("./cursorFromRowCol");
let countRows = require("./countRows");

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
	let {start, end} = sort(selection);
	let [startLineIndex, startOffset] = start;
	
	let [startRow, startCol] = rowColFromCursor(lines, startLineIndex, startOffset);
	
	if (startRow === 0) {
		return {
			start: [0, 0],
			end: [0, 0],
		};
	}
	
	let row = startRow - 1;
	let col = selectionEndCol;
	
	let cursor = cursorFromRowCol(lines, row, col);
	
	return {
		start: cursor,
		end: cursor,
	};
}

function down(lines, selection, selectionEndCol) {
	let {end} = sort(selection);
	let [endLineIndex, endOffset] = end;
	
	let [endRow, endCol] = rowColFromCursor(lines, endLineIndex, endOffset);
	
	if (endRow === countRows(lines) - 1) {
		let cursor = [endLineIndex, lines[endLineIndex].string.length];
		
		return {
			start: cursor,
			end: cursor,
		};
	}
	
	let row = endRow + 1;
	let col = selectionEndCol;
	
	let cursor = cursorFromRowCol(lines, row, col);
	
	return {
		start: cursor,
		end: cursor,
	};
}

function left(lines, selection) {
	let {start} = sort(selection);
	let [lineIndex, offset] = start;
	
	if (lineIndex === 0 && offset === 0) {
		return;
	}
	
	if (offset === 0) {
		let prevLine = lines[lineIndex - 1];
		
		let cursor = [lineIndex - 1, prevLine.string.length];
		
		return {
			start: cursor,
			end: cursor,
		};
	}
	
	let cursor = [lineIndex, offset - 1];
	
	return {
		start: cursor,
		end: cursor,
	};
}

function right(lines, selection) {
	let {end} = sort(selection);
	let [lineIndex, offset] = end;
	let line = lines[lineIndex];
	
	if (lineIndex === lines.length - 1 && offset === line.string.length) {
		return;
	}
	
	if (offset === line.string.length) {
		let cursor = [lineIndex + 1, 0];
		
		return {
			start: cursor,
			end: cursor,
		};
	}
	
	let cursor = [lineIndex, offset + 1];
	
	return {
		start: cursor,
		end: cursor,
	};
}

function expandOrContractUp(lines, selection) {
	
}

module.exports = {
	sort,
	isFull,
	up,
	down,
	left,
	right,
	expandOrContractUp,
};
