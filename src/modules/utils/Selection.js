let rowColFromCursor = require("./rowColFromCursor");
let cursorFromRowCol = require("./cursorFromRowCol");
let innerLineIndexAndOffsetFromCursor = require("./innerLineIndexAndOffsetFromCursor");
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

function s(start, end=null) {
	return {
		start,
		end: end || start,
	};
}

let api = {
	sort,
	isFull,
	
	up(lines, selection, selectionEndCol) {
		let {start, end} = sort(selection);
		let [startLineIndex, startOffset] = start;
		
		let [startRow, startCol] = rowColFromCursor(lines, startLineIndex, startOffset);
		
		if (startRow === 0) {
			return s([0, 0]);
		}
		
		let row = startRow - 1;
		let col = selectionEndCol;
		
		return s(cursorFromRowCol(lines, row, col));
	},
	
	down(lines, selection, selectionEndCol) {
		let {end} = sort(selection);
		let [endLineIndex, endOffset] = end;
		
		let [endRow, endCol] = rowColFromCursor(lines, endLineIndex, endOffset);
		
		if (endRow === countRows(lines) - 1) {
			return s([endLineIndex, lines[endLineIndex].string.length]);
		}
		
		let row = endRow + 1;
		let col = selectionEndCol;
		
		return s(cursorFromRowCol(lines, row, col));
	},
	
	left(lines, selection) {
		let {start} = sort(selection);
		let [lineIndex, offset] = start;
		
		if (isFull(selection)) {
			return s(start);
		}
		
		if (lineIndex === 0 && offset === 0) {
			return selection;
		}
		
		if (offset === 0) {
			let prevLine = lines[lineIndex - 1];
			
			return s([lineIndex - 1, prevLine.string.length]);
		}
		
		return s([lineIndex, offset - 1]);
	},
	
	right(lines, selection) {
		let {end} = sort(selection);
		let [lineIndex, offset] = end;
		let line = lines[lineIndex];
		
		if (isFull(selection)) {
			return s(end);
		}
		
		if (lineIndex === lines.length - 1 && offset === line.string.length) {
			return selection;
		}
		
		if (offset === line.string.length) {
			return s([lineIndex + 1, 0]);
		}
		
		return s([lineIndex, offset + 1]);
	},
	
	pageUp(lines, rows, selection, selectionEndCol) {
		let {start, end} = sort(selection);
		let [startLineIndex, startOffset] = start;
		
		let [startRow, startCol] = rowColFromCursor(lines, startLineIndex, startOffset);
		
		let row = Math.max(0, startRow - rows);
		let col = selectionEndCol;
		
		return s(cursorFromRowCol(lines, row, col));
	},
	
	pageDown(lines, rows, selection, selectionEndCol) {
		let {end} = sort(selection);
		let [endLineIndex, endOffset] = end;
		
		let [endRow, endCol] = rowColFromCursor(lines, endLineIndex, endOffset);
		
		let row = Math.min(endRow + rows, countRows(lines) - 1);
		let col = selectionEndCol;
		
		return s(cursorFromRowCol(lines, row, col));
	},
	
	end(lines, selection) {
		let [lineIndex, offset] = selection;
		
		let line = lines[lineIndex];
		
		let [innerLineIndex, innerLineOffset] = innerLineIndexAndOffsetFromCursor(lines, lineIndex, offset);
		
		let innerLine = line.height > 1 ? line.wrappedLines[innerLineIndex] : line;
		
		
		if (line.height > 1) {
			if (innerLineOffset === innerLine.string.length) {
				// go to 
			} else {
				
			}
		} else {
			return s([lineIndex, line.string.length]);
		}
		
		
		return selection;
	},
	
	home(lines, selection) {
		// home of wrap, then home of line (indent), then 0
		return selection;
	},
	
	expandOrContractUp(lines, selection, selectionEndCol) {
		let {start, end} = selection;
		let [lineIndex, offset] = end;
		
		let [endRow, endCol] = rowColFromCursor(lines, lineIndex, offset);
		
		if (endRow === 0) {
			return s(start, [0, 0]);
		}
		
		let row = endRow - 1;
		let col = selectionEndCol;
		
		return s(start, cursorFromRowCol(lines, row, col));
	},
	
	expandOrContractDown(lines, selection, selectionEndCol) {
		let {start, end} = selection;
		let [lineIndex, offset] = end;
		
		let [endRow, endCol] = rowColFromCursor(lines, lineIndex, offset);
		
		if (endRow === countRows(lines) - 1) {
			return s(start, [lineIndex, lines[lineIndex].string.length]);
		}
		
		let row = endRow + 1;
		let col = selectionEndCol;
		
		return s(start, cursorFromRowCol(lines, row, col));
	},
	
	expandOrContractLeft(lines, selection) {
		let {start, end} = selection;
		let [lineIndex, offset] = end;
		let line = lines[lineIndex];
		
		if (lineIndex === 0 && offset === 0) {
			return selection;
		}
		
		if (offset === 0) {
			let line = lines[lineIndex - 1];
			
			return s(start, [lineIndex - 1, line.string.length]);
		}
		
		return s(start, [lineIndex, offset - 1]);
	},
	
	expandOrContractRight(lines, selection) {
		let {start, end} = selection;
		let [lineIndex, offset] = end;
		let line = lines[lineIndex];
		
		if (lineIndex === lines.length - 1 && offset === line.string.length) {
			return selection;
		}
		
		if (offset === line.string.length) {
			return s(start, [lineIndex + 1, 0]);
		}
		
		return s(start, [lineIndex, offset + 1]);
	},
};

module.exports = api;
