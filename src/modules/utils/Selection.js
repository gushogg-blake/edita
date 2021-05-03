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



let api = {
	sort,
	isFull,
	
	up(lines, selection, selectionEndCol) {
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
	},
	
	down(lines, selection, selectionEndCol) {
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
	},
	
	left(lines, selection) {
		let {start} = sort(selection);
		let [lineIndex, offset] = start;
		
		if (isFull(selection)) {
			return {
				start,
				end: start,
			};
		}
		
		if (lineIndex === 0 && offset === 0) {
			return selection;
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
	},
	
	right(lines, selection) {
		let {end} = sort(selection);
		let [lineIndex, offset] = end;
		let line = lines[lineIndex];
		
		if (isFull(selection)) {
			return {
				start: end,
				end,
			};
		}
		
		if (lineIndex === lines.length - 1 && offset === line.string.length) {
			return selection;
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
	},
	
	expandOrContractUp(lines, selection, selectionEndCol) {
		let {start, end} = selection;
		let [lineIndex, offset] = end;
		
		let [endRow, endCol] = rowColFromCursor(lines, lineIndex, offset);
		
		if (endRow === 0) {
			return {
				start,
				end: [0, 0],
			};
		}
		
		let row = endRow - 1;
		let col = selectionEndCol;
		
		let cursor = cursorFromRowCol(lines, row, col);
		
		return {
			start,
			end: cursor,
		};
	},
	
	expandOrContractDown(lines, selection, selectionEndCol) {
		let {start, end} = selection;
		let [lineIndex, offset] = end;
		
		let [endRow, endCol] = rowColFromCursor(lines, lineIndex, offset);
		
		if (endRow === countRows(lines) - 1) {
			return {
				start,
				end: [lineIndex, lines[lineIndex].string.length],
			};
		}
		
		let row = endRow + 1;
		let col = selectionEndCol;
		
		let cursor = cursorFromRowCol(lines, row, col);
		
		return {
			start,
			end: cursor,
		};
	},
	
	expandOrContractLeft(lines, selection) {
		let {start, end} = selection;
		let [lineIndex, offset] = end;
		let line = lines[lineIndex];
		
		if (lineIndex === 0 && offset === 0) {
			return;
		}
		
		if (offset === 0) {
			let line = lines[lineIndex - 1];
			
			return {
				start,
				end: [lineIndex - 1, line.string.length],
			};
		}
		
		return {
			start,
			end: [lineIndex, offset - 1],
		};
	},
	
	expandOrContractRight(lines, selection) {
		let {start, end} = selection;
		let [lineIndex, offset] = end;
		let line = lines[lineIndex];
		
		if (lineIndex === lines.length - 1 && offset === line.string.length) {
			return;
		}
		
		if (offset === line.string.length) {
			return {
				start,
				end: [lineIndex + 1, 0],
			};
		}
		
		return {
			start,
			end: [lineIndex, offset + 1],
		};
	},
};

module.exports = api;
