let rowColFromCursor = require("./rowColFromCursor");
let cursorFromRowCol = require("./cursorFromRowCol");
let innerLineIndexAndOffsetFromCursor = require("./innerLineIndexAndOffsetFromCursor");
let countInitialWhitespaceCols = require("./countInitialWhitespaceCols");
let getLineStartingRow = require("./getLineStartingRow");
let countRows = require("./countRows");
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
	
	home(lines, selection) {
		let [lineIndex, offset] = sort(selection).start;
		let [row, col] = rowColFromCursor(lines, lineIndex, offset);
		let line = lines[lineIndex];
		let [innerLineIndex, innerLineOffset] = innerLineIndexAndOffsetFromCursor(lines, lineIndex, offset);
		let initialWhitespaceCols = countInitialWhitespaceCols(line);
		
		if (line.height > 1 && innerLineIndex > 0) {
			let innerLine = line.wrappedLines[innerLineIndex];
		
			if (innerLineOffset === 0) {
				let startingRow = getLineStartingRow(lines, lineIndex);
				
				return s(cursorFromRowCol(lines, startingRow, initialWhitespaceCols));
			} else {
				return s(cursorFromRowCol(lines, row, line.indentOffset));
			}
		} else {
			if (col === initialWhitespaceCols) {
				return s(cursorFromRowCol(lines, row, 0));
			} else {
				return s(cursorFromRowCol(lines, row, initialWhitespaceCols));
			}
		}
	},
	
	end(lines, selection) {
		let [lineIndex, offset] = sort(selection).end;
		let line = lines[lineIndex];
		let [innerLineIndex, innerLineOffset] = innerLineIndexAndOffsetFromCursor(lines, lineIndex, offset);
		
		if (line.height > 1 && innerLineIndex < line.height - 1) {
			let innerLine = line.wrappedLines[innerLineIndex];
			
			if (innerLineOffset === innerLine.string.length - 1) {
				return s([lineIndex, line.string.length]);
			} else {
				return s([lineIndex, offset + (innerLine.string.length - innerLineOffset) - 1]);
			}
		} else {
			return s([lineIndex, line.string.length]);
		}
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
	
	expandOrContractPageUp(lines, rows, selection, selectionEndCol) {
		let {start, end} = selection;
		let [endLineIndex, endOffset] = end;
		
		let [endRow, endCol] = rowColFromCursor(lines, endLineIndex, endOffset);
		
		let row = Math.max(0, endRow - rows);
		let col = selectionEndCol;
		
		return s(start, cursorFromRowCol(lines, row, col));
	},
	
	expandOrContractPageDown(lines, rows, selection, selectionEndCol) {
		let {start, end} = selection;
		let [endLineIndex, endOffset] = end;
		
		let [endRow, endCol] = rowColFromCursor(lines, endLineIndex, endOffset);
		
		let row = Math.min(endRow + rows, countRows(lines) - 1);
		let col = selectionEndCol;
		
		return s(start, cursorFromRowCol(lines, row, col));
	},
	
	expandOrContractHome(lines, selection) {
		let {start, end} = selection;
		let [lineIndex, offset] = end;
		let [row, col] = rowColFromCursor(lines, lineIndex, offset);
		let line = lines[lineIndex];
		let [innerLineIndex, innerLineOffset] = innerLineIndexAndOffsetFromCursor(lines, lineIndex, offset);
		let initialWhitespaceCols = countInitialWhitespaceCols(line);
		
		if (line.height > 1 && innerLineIndex > 0) {
			let innerLine = line.wrappedLines[innerLineIndex];
		
			if (innerLineOffset === 0) {
				let startingRow = getLineStartingRow(lines, lineIndex);
				
				return s(start, cursorFromRowCol(lines, startingRow, initialWhitespaceCols));
			} else {
				return s(start, cursorFromRowCol(lines, row, line.indentOffset));
			}
		} else {
			if (col === initialWhitespaceCols) {
				return s(start, cursorFromRowCol(lines, row, 0));
			} else {
				return s(start, cursorFromRowCol(lines, row, initialWhitespaceCols));
			}
		}
	},
	
	expandOrContractEnd(lines, selection) {
		let {start, end} = selection;
		let [lineIndex, offset] = end;
		let line = lines[lineIndex];
		let [innerLineIndex, innerLineOffset] = innerLineIndexAndOffsetFromCursor(lines, lineIndex, offset);
		
		if (line.height > 1 && innerLineIndex < line.height - 1) {
			let innerLine = line.wrappedLines[innerLineIndex];
			
			if (innerLineOffset === innerLine.string.length - 1) {
				return s(start, [lineIndex, line.string.length]);
			} else {
				return s(start, [lineIndex, offset + (innerLine.string.length - innerLineOffset) - 1]);
			}
		} else {
			return s(start, [lineIndex, line.string.length]);
		}
	},
	
	startOfLineContent(lines, lineIndex) {
		return s(Cursor.startOfLineContent(lines, lineIndex));
	},
	
	endOfLineContent(lines, lineIndex) {
		return s(Cursor.endOfLineContent(lines, lineIndex));
	},
};

module.exports = api;
