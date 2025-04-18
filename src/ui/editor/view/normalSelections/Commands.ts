import regexMatch from "utils/regexMatch";
import {Selection, s, Cursor, c} from "core";

let wordUnderCursorRe = {
	wordChar: /[\w_]/,
	whitespaceChar: /\s/,
	word: /^[\w_]+/,
	whitespace: /^\s+/,
	symbol: /^[^\w\s_]+/,
};

export default class Commands {
	up() {
		let {row: startRow, col: startCol} = this.canvasUtils.rowColFromCursor(this.normalSelection.left);
		
		if (startRow === 0) {
			return s(c(0, 0));
		}
		
		let row = startRow - 1;
		let col = this.selectionEndCol;
		
		return s(this.canvasUtils.cursorFromRowCol({row, col}));
	}
	
	down() {
		let {right} = this.normalSelection;
		let {row: endRow, col: endCol} = this.canvasUtils.rowColFromCursor(right);
		
		if (endRow === this.canvasUtils.countLineRowsFolded() - 1) {
			return s(c(right.lineIndex, this.lines[right.lineIndex].string.length));
		}
		
		let row = endRow + 1;
		let col = this.selectionEndCol;
		
		return s(this.canvasUtils.cursorFromRowCol(row, col));
	}
	
	left() {
		let {left} = this.normalSelection;
		let {lineIndex, offset} = left;
		
		if (this.normalSelection.isFull()) {
			return s(left);
		}
		
		if (lineIndex === 0 && offset === 0) {
			return this.normalSelection;
		}
		
		if (offset === 0) {
			return s(c(lineIndex - 1, this.lines[lineIndex - 1].string.length));
		}
		
		return s(c(lineIndex, offset - 1));
	}
	
	right() {
		let {right} = this.normalSelection;
		let {lineIndex, offset} = right;
		let line = this.lines[lineIndex];
		
		if (this.normalSelection.isFull()) {
			return s(right);
		}
		
		if (lineIndex === this.lines.length - 1 && offset === line.string.length) {
			return this.normalSelection;
		}
		
		if (offset === line.string.length) {
			return s(c(lineIndex + 1, 0));
		}
		
		return s(c(lineIndex, offset + 1));
	}
	
	pageUp() {
		let {rows} = this.sizes;
		let {left} = this.normalSelection;
		
		let {row: startRow, col: startCol} = this.canvasUtils.rowColFromCursor(left);
		
		let row = Math.max(0, startRow - rows);
		let col = this.selectionEndCol;
		
		return s(this.canvasUtils.cursorFromRowCol(row, col));
	}
	
	pageDown() {
		let {rows} = this.sizes;
		let {right} = this.normalSelection;
		
		let {row: endRow, col: endCol} = this.canvasUtils.rowColFromCursor(right);
		
		let row = Math.min(endRow + rows, this.canvasUtils.countLineRowsFolded() - 1);
		let col = this.selectionEndCol;
		
		return s(this.canvasUtils.cursorFromRowCol(row, col));
	}
	
	home() {
		let {wrappedLines} = this;
		let {left} = this.normalSelection;
		let {lineIndex, offset} = left;
		let {row, col} = this.canvasUtils.rowColFromCursor(left);
		let wrappedLine = wrappedLines[lineIndex];
		let {line} = wrappedLine;
		let {lineRowIndex, offsetInRow} = this.canvasUtils.lineRowIndexAndOffsetFromCursor(left);
		let {indentCols} = line;
		
		if (wrappedLine.height > 1 && lineRowIndex > 0) {
			if (offsetInRow === 0) {
				let startingRow = this.canvasUtils.getLineStartingRow(lineIndex);
				
				return s(this.canvasUtils.cursorFromRowCol(startingRow, indentCols));
			} else {
				return s(this.canvasUtils.cursorFromRowCol(row, indentCols));
			}
		} else {
			if (!this.normalSelection.isFull() && col === indentCols) {
				return s(this.canvasUtils.cursorFromRowCol(row, 0));
			} else {
				return s(this.canvasUtils.cursorFromRowCol(row, indentCols));
			}
		}
	}
	
	end() {
		let {wrappedLines} = this;
		let {right} = this.normalSelection;
		let {lineIndex, offset} = right;
		let wrappedLine = wrappedLines[lineIndex];
		let {line} = wrappedLine;
		let {lineRowIndex, offsetInRow} = this.canvasUtils.lineRowIndexAndOffsetFromCursor(right);
		
		if (wrappedLine.height > 1 && lineRowIndex < wrappedLine.height - 1) {
			let lineRow = wrappedLine.lineRows[lineRowIndex];
			
			if (offsetInRow === lineRow.string.length - 1) {
				return s(c(lineIndex, line.string.length));
			} else {
				return s(c(lineIndex, offset + (lineRow.string.length - offsetInRow) - 1));
			}
		} else {
			return s(c(lineIndex, line.string.length));
		}
	}
	
	wordLeft() {
		let {wrappedLines} = this;
		let {lineIndex, offset} = this.normalSelection.left;
		let {line} = wrappedLines[lineIndex];
		
		if (offset === 0) {
			return this.Selection.left();
		} else {
			let stringToCursor = line.string.substr(0, offset).split("").reverse().join("");
			let [whiteSpaceOrWord] = stringToCursor.match(/^\s*(\s+|\w+|[^\w\s]+)/);
			
			return s(c(lineIndex, offset - whiteSpaceOrWord.length));
		}
	}
	
	wordRight() {
		let {wrappedLines} = this;
		let {lineIndex, offset} = this.normalSelection.right;
		let {line} = wrappedLines[lineIndex];
		
		if (offset === line.string.length) {
			return this.Selection.right();
		} else {
			let stringToCursor = line.string.substr(offset);
			let [whiteSpaceOrWord] = stringToCursor.match(/^\s*(\s+|\w+|[^\w\s]+)/);
			
			return s(c(lineIndex, offset + whiteSpaceOrWord.length));
		}
	}
	
	expandOrContractUp() {
		let {start, end} = this.normalSelection;
		let {row: endRow, col: endCol} = this.canvasUtils.rowColFromCursor(end);
		
		if (endRow === 0) {
			return s(start, c(0, 0));
		}
		
		let row = endRow - 1;
		let col = this.selectionEndCol;
		
		return s(start, this.canvasUtils.cursorFromRowCol(row, col));
	}
	
	expandOrContractDown() {
		let {wrappedLines} = this;
		let {start, end} = this.normalSelection;
		let {lineIndex} = end;
		let {row: endRow, col: endCol} = this.canvasUtils.rowColFromCursor(end);
		
		if (endRow === this.canvasUtils.countLineRowsFolded() - 1) {
			return s(start, c(lineIndex, wrappedLines[lineIndex].line.string.length));
		}
		
		let row = endRow + 1;
		let col = this.selectionEndCol;
		
		return s(start, this.canvasUtils.cursorFromRowCol(row, col));
	}
	
	expandOrContractLeft() {
		let {wrappedLines} = this;
		let {start, end} = this.normalSelection;
		let {lineIndex, offset} = end;
		
		if (lineIndex === 0 && offset === 0) {
			return this.normalSelection;
		}
		
		if (offset === 0) {
			let prevLine = wrappedLines[lineIndex - 1].line;
			
			return s(start, c(lineIndex - 1, prevLine.string.length));
		}
		
		return s(start, c(lineIndex, offset - 1));
	}
	
	expandOrContractRight() {
		let {wrappedLines} = this;
		let {start, end} = this.normalSelection;
		let {lineIndex, offset} = end;
		let {line} = wrappedLines[lineIndex];
		
		if (lineIndex === wrappedLines.length - 1 && offset === line.string.length) {
			return this.normalSelection;
		}
		
		if (offset === line.string.length) {
			return s(start, c(lineIndex + 1, 0));
		}
		
		return s(start, c(lineIndex, offset + 1));
	}
	
	expandOrContractPageUp() {
		let {rows} = this.sizes;
		let {start, end} = this.normalSelection;
		let {row: endRow, col: endCol} = this.canvasUtils.rowColFromCursor(end);
		
		let row = Math.max(0, endRow - rows);
		let col = this.selectionEndCol;
		
		return s(start, this.canvasUtils.cursorFromRowCol(row, col));
	}
	
	expandOrContractPageDown() {
		let {rows} = this.sizes;
		let {start, end} = this.normalSelection;
		let {row: endRow, col: endCol} = this.canvasUtils.rowColFromCursor(end);
		
		let row = Math.min(endRow + rows, this.canvasUtils.countLineRowsFolded() - 1);
		let col = this.selectionEndCol;
		
		return s(start, this.canvasUtils.cursorFromRowCol(row, col));
	}
	
	expandOrContractHome() {
		let {wrappedLines} = this;
		let {start, end} = this.normalSelection;
		let {lineIndex, offset} = end;
		let {row, col} = this.canvasUtils.rowColFromCursor(end);
		let wrappedLine = wrappedLines[lineIndex];
		let {line} = wrappedLine;
		let {lineRowIndex, offsetInRow} = this.canvasUtils.lineRowIndexAndOffsetFromCursor(end);
		let {indentCols} = line;
		
		if (wrappedLine.height > 1 && lineRowIndex > 0) {
			if (offsetInRow === 0) {
				let startingRow = this.canvasUtils.getLineStartingRow(lineIndex);
				
				return s(start, this.canvasUtils.cursorFromRowCol(startingRow, indentCols));
			} else {
				return s(start, this.canvasUtils.cursorFromRowCol(row, indentCols));
			}
		} else {
			if (col === indentCols) {
				return s(start, this.canvasUtils.cursorFromRowCol(row, 0));
			} else {
				return s(start, this.canvasUtils.cursorFromRowCol(row, indentCols));
			}
		}
	}
	
	expandOrContractEnd() {
		let {wrappedLines} = this;
		let {start, end} = this.normalSelection;
		let {lineIndex, offset} = end;
		let wrappedLine = wrappedLines[lineIndex];
		let {line} = wrappedLine;
		let {lineRowIndex, offsetInRow} = this.canvasUtils.lineRowIndexAndOffsetFromCursor(end);
		
		if (wrappedLine.height > 1 && lineRowIndex < wrappedLine.height - 1) {
			let lineRow = wrappedLine.lineRows[lineRowIndex];
			
			if (offsetInRow === lineRow.string.length - 1) {
				return s(start, c(lineIndex, line.string.length));
			} else {
				return s(start, c(lineIndex, offset + (lineRow.string.length - offsetInRow) - 1));
			}
		} else {
			return s(start, c(lineIndex, line.string.length));
		}
	}
	
	expandOrContractWordLeft() {
		let {wrappedLines} = this;
		let {start, end} = this.normalSelection;
		let {lineIndex, offset} = end;
		let {line} = wrappedLines[lineIndex];
		
		if (offset === 0) {
			return this.Selection.expandOrContractLeft();
		} else {
			let stringToCursor = line.string.substr(0, offset).split("").reverse().join("");
			let [whiteSpaceOrWord] = stringToCursor.match(/^\s*(\s+|\w+|[^\w\s]+)/);
			
			return s(start, c(lineIndex, offset - whiteSpaceOrWord.length));
		}
	}
	
	expandOrContractWordRight() {
		let {wrappedLines} = this;
		let {start, end} = this.normalSelection;
		let {lineIndex, offset} = end;
		let {line} = wrappedLines[lineIndex];
		
		if (offset === line.string.length) {
			return this.Selection.expandOrContractRight();
		} else {
			let stringToCursor = line.string.substr(offset);
			let [whiteSpaceOrWord] = stringToCursor.match(/^\s*(\s+|\w+|[^\w\s]+)/);
			
			return s(start, c(lineIndex, offset + whiteSpaceOrWord.length));
		}
	}
	
	startOfLineContent(lineIndex) {
		return s(this.document.cursorAtStartOfLineContent(lineIndex));
	}
	
	endOfLineContent(lineIndex) {
		return s(this.document.cursorAtEndOfLine(lineIndex));
	}
	
	wordUnderCursor(cursor) {
		let {wrappedLines} = this;
		let {lineIndex, offset} = cursor;
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
		
		return s(c(lineIndex, offset - left), c(lineIndex, offset + right));
	}
	
	all() {
		return this.document.selectAll();
	}
}
