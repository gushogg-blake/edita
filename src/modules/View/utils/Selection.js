let regexMatch = require("../../../utils/regexMatch");
let Selection = require("../../utils/Selection");
let Cursor = require("../../utils/Cursor");

let {
	s,
	sort,
	isFull,
} = Selection;

let wordUnderCursorRe = {
	wordChar: /[\w_]/,
	whitespaceChar: /\s/,
	word: /^[\w_]+/,
	whitespace: /^\s+/,
	symbol: /^[^\w\s_]+/,
};

module.exports = {
	isFull() {
		return isFull(this.normalSelection);
	},
	
	up() {
		let {start, end} = sort(this.normalSelection);
		let [startLineIndex, startOffset] = start;
		
		let [startRow, startCol] = this.rowColFromCursor(startLineIndex, startOffset);
		
		if (startRow === 0) {
			return s([0, 0]);
		}
		
		let row = startRow - 1;
		let col = this.selectionEndCol;
		
		return s(this.cursorFromRowCol(row, col));
	},
	
	down() {
		let {wrappedLines} = this;
		let {end} = sort(this.normalSelection);
		let [endLineIndex, endOffset] = end;
		
		let [endRow, endCol] = this.rowColFromCursor(endLineIndex, endOffset);
		
		if (endRow === this.countRows() - 1) {
			return s([endLineIndex, wrappedLines[endLineIndex].string.length]);
		}
		
		let row = endRow + 1;
		let col = this.selectionEndCol;
		
		return s(this.cursorFromRowCol(row, col));
	},
	
	left() {
		let {wrappedLines} = this;
		let {start} = sort(this.normalSelection);
		let [lineIndex, offset] = start;
		
		if (this.Selection.isFull()) {
			return s(start);
		}
		
		if (lineIndex === 0 && offset === 0) {
			return this.normalSelection;
		}
		
		if (offset === 0) {
			let prevLine = wrappedLines[lineIndex - 1].line;
			
			return s([lineIndex - 1, prevLine.string.length]);
		}
		
		return s([lineIndex, offset - 1]);
	},
	
	right() {
		let {wrappedLines} = this;
		let {end} = sort(this.normalSelection);
		let [lineIndex, offset] = end;
		let {line} = wrappedLines[lineIndex];
		
		if (this.Selection.isFull()) {
			return s(end);
		}
		
		if (lineIndex === wrappedLines.length - 1 && offset === line.string.length) {
			return this.normalSelection;
		}
		
		if (offset === line.string.length) {
			return s([lineIndex + 1, 0]);
		}
		
		return s([lineIndex, offset + 1]);
	},
	
	pageUp() {
		let {rows} = this.sizes;
		let {start, end} = sort(this.normalSelection);
		let [startLineIndex, startOffset] = start;
		
		let [startRow, startCol] = this.rowColFromCursor(startLineIndex, startOffset);
		
		let row = Math.max(0, startRow - rows);
		let col = this.selectionEndCol;
		
		return s(this.cursorFromRowCol(row, col));
	},
	
	pageDown() {
		let {wrappedLines} = this;
		let {rows} = this.sizes;
		let {end} = sort(this.normalSelection);
		let [endLineIndex, endOffset] = end;
		
		let [endRow, endCol] = this.rowColFromCursor(endLineIndex, endOffset);
		
		let row = Math.min(endRow + rows, this.countRows() - 1);
		let col = this.selectionEndCol;
		
		return s(this.cursorFromRowCol(row, col));
	},
	
	home() {
		let {wrappedLines} = this;
		let [lineIndex, offset] = sort(this.normalSelection).start;
		let [row, col] = this.rowColFromCursor(lineIndex, offset);
		let wrappedLine = wrappedLines[lineIndex];
		let {line} = wrappedLine;
		let [innerLineIndex, innerLineOffset] = this.innerLineIndexAndOffsetFromCursor(lineIndex, offset);
		let {indentCols} = line;
		
		if (wrappedLine.height > 1 && innerLineIndex > 0) {
			let lineRow = wrappedLine.rows[innerLineIndex];
		
			if (innerLineOffset === 0) {
				let startingRow = getLineStartingRow(lineIndex);
				
				return s(this.cursorFromRowCol(startingRow, indentCols));
			} else {
				return s(this.cursorFromRowCol(row, indentCols));
			}
		} else {
			if (col === indentCols) {
				return s(this.cursorFromRowCol(row, 0));
			} else {
				return s(this.cursorFromRowCol(row, indentCols));
			}
		}
	},
	
	end() {
		let {wrappedLines} = this;
		let [lineIndex, offset] = sort(this.normalSelection).end;
		let wrappedLine = wrappedLines[lineIndex];
		let {line} = wrappedLine;
		let [innerLineIndex, innerLineOffset] = this.innerLineIndexAndOffsetFromCursor(lineIndex, offset);
		
		if (wrappedLine.height > 1 && innerLineIndex < wrappedLine.height - 1) {
			let lineRow = wrappedLine.rows[innerLineIndex];
			
			if (innerLineOffset === lineRow.string.length - 1) {
				return s([lineIndex, line.string.length]);
			} else {
				return s([lineIndex, offset + (lineRow.string.length - innerLineOffset) - 1]);
			}
		} else {
			return s([lineIndex, line.string.length]);
		}
	},
	
	wordLeft() {
		let {wrappedLines} = this;
		let {start} = sort(this.normalSelection);
		let [lineIndex, offset] = start;
		let {line} = wrappedLines[lineIndex];
		
		if (offset === 0) {
			return this.Selection.left();
		} else {
			let stringToCursor = line.string.substr(0, offset).split("").reverse().join("");
			let [whiteSpaceOrWord] = stringToCursor.match(/^\s*(\s+|\w+|[^\w\s]+)/);
			
			return s([lineIndex, offset - whiteSpaceOrWord.length]);
		}
	},
	
	wordRight() {
		let {wrappedLines} = this;
		let {end} = sort(this.normalSelection);
		let [lineIndex, offset] = end;
		let {line} = wrappedLines[lineIndex];
		
		if (offset === line.string.length) {
			return this.Selection.right();
		} else {
			let stringToCursor = line.string.substr(offset);
			let [whiteSpaceOrWord] = stringToCursor.match(/^\s*(\s+|\w+|[^\w\s]+)/);
			
			return s([lineIndex, offset + whiteSpaceOrWord.length]);
		}
	},
	
	expandOrContractUp() {
		let {start, end} = this.normalSelection;
		let [lineIndex, offset] = end;
		
		let [endRow, endCol] = this.rowColFromCursor(lineIndex, offset);
		
		if (endRow === 0) {
			return s(start, [0, 0]);
		}
		
		let row = endRow - 1;
		let col = this.selectionEndCol;
		
		return s(start, this.cursorFromRowCol(row, col));
	},
	
	expandOrContractDown() {
		let {wrappedLines} = this;
		let {start, end} = this.normalSelection;
		let [lineIndex, offset] = end;
		
		let [endRow, endCol] = this.rowColFromCursor(lineIndex, offset);
		
		if (endRow === this.countRows() - 1) {
			return s(start, [lineIndex, wrappedLines[lineIndex].line.string.length]);
		}
		
		let row = endRow + 1;
		let col = this.selectionEndCol;
		
		return s(start, this.cursorFromRowCol(row, col));
	},
	
	expandOrContractLeft() {
		let {wrappedLines} = this;
		let {start, end} = this.normalSelection;
		let [lineIndex, offset] = end;
		
		if (lineIndex === 0 && offset === 0) {
			return this.normalSelection;
		}
		
		if (offset === 0) {
			let prevLine = wrappedLines[lineIndex - 1].line;
			
			return s(start, [lineIndex - 1, prevLine.string.length]);
		}
		
		return s(start, [lineIndex, offset - 1]);
	},
	
	expandOrContractRight() {
		let {wrappedLines} = this;
		let {start, end} = this.normalSelection;
		let [lineIndex, offset] = end;
		let {line} = wrappedLines[lineIndex];
		
		if (lineIndex === wrappedLines.length - 1 && offset === line.string.length) {
			return this.normalSelection;
		}
		
		if (offset === line.string.length) {
			return s(start, [lineIndex + 1, 0]);
		}
		
		return s(start, [lineIndex, offset + 1]);
	},
	
	expandOrContractPageUp() {
		let {rows} = this.sizes;
		let {start, end} = this.normalSelection;
		let [endLineIndex, endOffset] = end;
		
		let [endRow, endCol] = this.rowColFromCursor(endLineIndex, endOffset);
		
		let row = Math.max(0, endRow - rows);
		let col = this.selectionEndCol;
		
		return s(start, this.cursorFromRowCol(row, col));
	},
	
	expandOrContractPageDown() {
		let {rows} = this.sizes;
		let {start, end} = this.normalSelection;
		let [endLineIndex, endOffset] = end;
		
		let [endRow, endCol] = this.rowColFromCursor(endLineIndex, endOffset);
		
		let row = Math.min(endRow + rows, this.countRows() - 1);
		let col = this.selectionEndCol;
		
		return s(start, this.cursorFromRowCol(row, col));
	},
	
	expandOrContractHome() {
		let {wrappedLines} = this;
		let {start, end} = this.normalSelection;
		let [lineIndex, offset] = end;
		let [row, col] = this.rowColFromCursor(lineIndex, offset);
		let wrappedLine = wrappedLines[lineIndex];
		let {line} = wrappedLine;
		let [innerLineIndex, innerLineOffset] = this.innerLineIndexAndOffsetFromCursor(lineIndex, offset);
		let {indentCols} = line;
		
		if (wrappedLine.height > 1 && innerLineIndex > 0) {
			if (innerLineOffset === 0) {
				let startingRow = this.getLineStartingRow(lineIndex);
				
				return s(start, this.cursorFromRowCol(startingRow, indentCols));
			} else {
				return s(start, this.cursorFromRowCol(row, indentCols));
			}
		} else {
			if (col === indentCols) {
				return s(start, this.cursorFromRowCol(row, 0));
			} else {
				return s(start, this.cursorFromRowCol(row, indentCols));
			}
		}
	},
	
	expandOrContractEnd() {
		let {wrappedLines} = this;
		let {start, end} = this.normalSelection;
		let [lineIndex, offset] = end;
		let wrappedLine = wrappedLines[lineIndex];
		let {line} = wrappedLine;
		let [innerLineIndex, innerLineOffset] = this.innerLineIndexAndOffsetFromCursor(lineIndex, offset);
		
		if (wrappedLine.height > 1 && innerLineIndex < wrappedLine.height - 1) {
			let lineRow = wrappedLine.rows[innerLineIndex];
			
			if (innerLineOffset === lineRow.string.length - 1) {
				return s(start, [lineIndex, line.string.length]);
			} else {
				return s(start, [lineIndex, offset + (lineRow.string.length - innerLineOffset) - 1]);
			}
		} else {
			return s(start, [lineIndex, line.string.length]);
		}
	},
	
	expandOrContractWordLeft() {
		let {wrappedLines} = this;
		let {start, end} = this.normalSelection;
		let [lineIndex, offset] = end;
		let {line} = wrappedLines[lineIndex];
		
		if (offset === 0) {
			return this.Selection.expandOrContractLeft();
		} else {
			let stringToCursor = line.string.substr(0, offset).split("").reverse().join("");
			let [whiteSpaceOrWord] = stringToCursor.match(/^\s*(\s+|\w+|[^\w\s]+)/);
			
			return s(start, [lineIndex, offset - whiteSpaceOrWord.length]);
		}
	},
	
	expandOrContractWordRight() {
		let {wrappedLines} = this;
		let {start, end} = this.normalSelection;
		let [lineIndex, offset] = end;
		let {line} = wrappedLines[lineIndex];
		
		if (offset === line.string.length) {
			return this.Selection.expandOrContractRight();
		} else {
			let stringToCursor = line.string.substr(offset);
			let [whiteSpaceOrWord] = stringToCursor.match(/^\s*(\s+|\w+|[^\w\s]+)/);
			
			return s(start, [lineIndex, offset + whiteSpaceOrWord.length]);
		}
	},
	
	startOfLineContent(lineIndex) {
		return s(Cursor.startOfLineContent(this.wrappedLines, lineIndex));
	},
	
	endOfLineContent(lineIndex) {
		return s(Cursor.endOfLineContent(this.wrappedLines, lineIndex));
	},
	
	wordUnderCursor(cursor) {
		let {wrappedLines} = this;
		let [lineIndex, offset] = cursor;
		let {line} = wrappedLines[lineIndex];
		let {string} = line;
		
		if (string.length === 0) {
			return s(cursor);
		}
		
		if (offset === string.length) {
			offset--;
		}
		
		let ch = string[offset];
		let wordRe;
		
		if (ch.match(wordUnderCursorRe.wordChar)) {
			wordRe = wordUnderCursorRe.word;
		} else if (ch.match(wordUnderCursorRe.whitespaceChar)) {
			wordRe = wordUnderCursorRe.whitespace;
		} else {
			wordRe = wordUnderCursorRe.symbol;
		}
		
		let right = regexMatch(string.substr(offset), wordRe).length;
		let left = regexMatch(string.substr(0, offset).split("").reverse().join(""), wordRe).length;
		
		return s([lineIndex, offset - left], [lineIndex, offset + right]);
	},
};
