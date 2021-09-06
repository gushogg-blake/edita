let Selection = require("modules/utils/Selection");
let expandTabs = require("modules/utils/string/expandTabs");

module.exports = {
	calculateNormalSelectionRegions(selection) {
		let regions = [];
		
		let {colWidth, rowHeight} = measurements;
		let {start, end} = Selection.sort(selection);
		
		let [startRow, startCol] = rowColFromCursor(wrappedLines, start);
		let [endRow, endCol] = rowColFromCursor(wrappedLines, end);
		
		let row = startRow;
		let col = startCol;
		
		let lineStartingRow = getLineStartingRow(wrappedLines, start.lineIndex);
		let lineRowIndex = startRow - lineStartingRow;
		
		let startScreenRow = startRow - scrollPosition.row;
		
		for (let i = start.lineIndex; i <= end.lineIndex; i++) {
			let wrappedLine = wrappedLines[i];
			let {line} = wrappedLine;
			
			for (let j = 0; j < wrappedLine.height; j++) {
				if (i === start.lineIndex && j < lineRowIndex) {
					continue;
				}
				
				if (startRow === endRow) {
					// single-line selection
					
					let [x, y] = screenCoordsFromRowCol(
						wrappedLines,
						startRow,
						startCol,
						scrollPosition,
						measurements,
					);
					
					let width = endCol - startCol;
					
					regions.push([x, y, width * colWidth, rowHeight]);
					
					break;
				}
				
				if (row === endRow) {
					// last row of multi-line selection
					// highlight beginning of line to end col
					
					let [x, y] = screenCoordsFromRowCol(
						wrappedLines,
						row,
						0,
						scrollPosition,
						measurements,
					);
					
					let width = endCol;
					
					regions.push([x, y, width * colWidth, rowHeight]);
					
					break;
				}
				
				if (row === startRow) {
					// first row of multi-line selection
					// highlight start col to end of line, plus 1 for the newline
					
					let [x, y] = screenCoordsFromRowCol(
						wrappedLines,
						startRow,
						startCol,
						scrollPosition,
						measurements,
					);
					
					let width = wrappedLine.rows[j].width - startCol + 1;
					
					if (j > 0) {
						width += line.indentCols;
					}
					
					regions.push([x, y, width * colWidth, rowHeight]);
				}
				
				if (row !== startRow && row !== endRow) {
					// inner row of multi-line selection
					// highlight whole line plus 1 for the newline at the end
					
					let [x, y] = screenCoordsFromRowCol(
						wrappedLines,
						row,
						0,
						scrollPosition,
						measurements,
					);
					
					let width = wrappedLine.rows[j].width + 1;
					
					if (j > 0) {
						width += line.indentCols;
					}
					
					regions.push([x, y, width * colWidth, rowHeight]);
				}
				
				row++;
			}
		}
		
		return regions;
	}
	
	countRows() {
		let rows = 0;
		
		for (let wrappedLine of wrappedLines) {
			rows += wrappedLine.height;
		}
		
		return rows;
	}
	
	cursorFromRowCol(row, col, beforeTab=false) {
		let lineIndex = 0;
		let offset = 0;
		let r = 0;
		
		for (let i = 0; i < wrappedLines.length - 1; i++) {
			if (r + wrappedLines[i].height > row) {
				break;
			}
			
			r += wrappedLines[i].height;
			lineIndex++;
		}
		
		lineIndex = Math.min(lineIndex, wrappedLines.length - 1);
		
		let wrappedLine = wrappedLines[lineIndex];
		let lineRowIndex = row - r;
		
		if (lineRowIndex > wrappedLine.height - 1) { // mouse is below text
			return {
				lineIndex,
				offset: wrappedLine.line.string.length,
			};
		}
		
		let i = 0;
		
		while (i < lineRowIndex) {
			offset += wrappedLine.rows[i].string.length;
			i++;
		}
		
		if (lineRowIndex > 0) {
			col -= wrappedLine.line.indentCols;
			
			if (col < 0) {
				col = 0;
			}
		}
		
		// consume chars until c is col
		
		let c = 0;
		
		let {variableWidthParts} = wrappedLine.rows[lineRowIndex];
		
		for (let part of variableWidthParts) {
			if (c === col) {
				break;
			}
			
			if (part.type === "tab") {
				let {width} = part;
				
				if (c + width > col) {
					// the col is within the tab
					// if more than half way go to after the tab
					// otherwise stay before it
					
					if (!beforeTab && col - c > width / 2) {
						offset++;
					}
					
					break;
				}
				
				c += width;
				offset++;
			} else if (part.type === "string") {
				let {string} = part;
				
				if (c + string.length > col) {
					// col is within the current string
					// add the remaining cols to the offset
					
					offset += col - c;
					
					break;
				}
				
				c += string.length;
				offset += string.length;
			}
		}
		
		return {lineIndex, offset};
	}
	
	cursorFromScreenCoords(x, y) {
		return cursorFromRowCol(...this.cursorRowColFromScreenCoords(x, y));
	}
	
	cursorRowColFromScreenCoords(x, y) {
		let {
			rowHeight,
			colWidth,
		} = measurements;
		
		let coordsXHint = 2;
		
		let marginOffset = calculateMarginOffset(wrappedLines, measurements);
		
		let screenCol = Math.round((x - marginOffset + coordsXHint + scrollPosition.x) / colWidth);
		let screenRow = Math.floor((y - topMargin) / rowHeight) + scrollPosition.row;
		
		return [
			Math.max(0, screenRow),
			Math.max(0, screenCol),
		];
	}
	
	findFirstVisibleLine() {
		let row = 0;
		
		for (let i = 0; i < wrappedLines.length; i++) {
			let wrappedLine = wrappedLines[i];
			
			if (row + wrappedLine.height > scrollPosition.row) {
				return {
					wrappedLine,
					lineIndex: i,
					lineRowIndex: scrollPosition.row - row,
				};
			}
			
			row += wrappedLine.height;
		}
		
		return null;
	}
	
	getLineRangeTotalHeight(startLineIndex, endLineIndex) {
		let height = 0;
		
		for (let i = startLineIndex; i <= endLineIndex; i++) {
			height += wrappedLines[i].height;
		}
		
		return height;
	}
	
	getLineStartingRow(lineIndex) {
		let startingRow = 0;
		
		for (let i = 0; i < wrappedLines.length; i++) {
			if (i === lineIndex) {
				break;
			}
			
			startingRow += wrappedLines[i].height;
		}
		
		return startingRow;
	}
	
	innerLineIndexAndOffsetFromCursor(lineIndex, offset) {
		let {lineIndex, offset} = cursor;
		let wrappedLine = wrappedLines[lineIndex];
		let innerLineIndex = 0;
		let lineRow;
		let innerLineOffset = offset;
		
		for (let i = 0; i < wrappedLine.height; i++) {
			lineRow = wrappedLine.rows[i];
			
			if (wrappedLine.height > 1 && i !== wrappedLine.height - 1) {
				if (innerLineOffset < lineRow.string.length) {
					break;
				}
			} else {
				if (innerLineOffset <= lineRow.string.length) {
					break;
				}
			}
			
			innerLineIndex++;
			innerLineOffset -= lineRow.string.length;
		}
		
		return [innerLineIndex, innerLineOffset];
	}
	
	insertLineIndexFromScreenY(y) {
		let {
			rowHeight,
		} = measurements;
		
		y -= topMargin;
		
		let middle = rowHeight / 2;
		let screenRow = Math.floor(y / rowHeight) + scrollPosition.row;
		let offset = y % rowHeight;
		let offsetFromMiddle = offset - middle;
		
		let aboveLineIndex = null;
		let belowLineIndex = null;
		
		if (y < middle) {
			belowLineIndex = 0;
		} else {
			let rowAbove;
			let rowBelow;
			
			if (offset > middle) {
				rowAbove = screenRow;
				rowBelow = screenRow + 1;
			} else {
				rowAbove = screenRow - 1;
				rowBelow = screenRow;
			}
			
			if (rowAbove >= 0) {
				aboveLineIndex = cursorFromRowCol(wrappedLines, rowAbove, 0).lineIndex;
			}
			
			if (aboveLineIndex === null || aboveLineIndex < wrappedLines.length - 1) {
				belowLineIndex = cursorFromRowCol(wrappedLines, rowBelow, 0).lineIndex;
			}
		}
		
		if (aboveLineIndex === belowLineIndex) {
			let lineIndex = aboveLineIndex;
			let startingScreenRow = getLineStartingRow(wrappedLines, lineIndex) - scrollPosition.row;
			let startingY = startingScreenRow * rowHeight;
			let height = wrappedLines[lineIndex].height * rowHeight;
			let middle = height / 2;
			let offset = y - startingY;
			
			offsetFromMiddle = offset - middle;
		}
		
		return {
			aboveLineIndex,
			belowLineIndex,
			offset: offsetFromMiddle / middle,
		};
	}
	
	rowColFromCursor(cursor) {
		let {lineIndex, offset} = cursor;
		let row = 0;
		
		for (let i = 0; i < lineIndex; i++) {
			row += wrappedLines[i].height;
		}
		
		let wrappedLine = wrappedLines[lineIndex];
		
		let lineRowIndex = 0;
		let lineRow;
		let innerOffset = offset;
		
		for (let i = 0; i < wrappedLine.height; i++) {
			lineRow = wrappedLine.rows[i];
			
			/*
			if we're at the end of a line that ends in a soft wrap, go to the next row
			otherwise (if we're at the end of an actual line, whether wrapped or not)
			we can be at the end
			*/
			
			if (wrappedLine.height > 1 && i !== wrappedLine.height - 1) {
				if (innerOffset < lineRow.string.length) {
					break;
				}
			} else {
				if (innerOffset <= lineRow.string.length) {
					break;
				}
			}
			
			row++;
			lineRowIndex++;
			innerOffset -= lineRow.string.length;
		}
		
		let col = expandTabs(lineRow.string.substr(0, innerOffset)).length;
		
		if (lineRowIndex > 0) {
			col += wrappedLine.line.indentCols;
		}
		
		return [row, col];
	}
	
	rowColFromScreenCoords(x, y) {
		let {
			rowHeight,
			colWidth,
		} = measurements;
		
		let coordsXHint = 2;
		
		let marginOffset = calculateMarginOffset(wrappedLines, measurements);
		
		let screenCol = Math.floor((x - this.sizes.marginOffset + coordsXHint + scrollPosition.x) / colWidth);
		let screenRow = Math.floor((y - topMargin) / rowHeight) + scrollPosition.row;
		
		return [
			Math.max(0, screenRow),
			Math.max(0, screenCol),
		];
	}
	
	screenCoordsFromCursor(cursor) {
		return this.screenCoordsFromRowCol(...this.rowColFromCursor(cursor));
	}
	
	screenCoordsFromRowCol(row, col) {
		let {
			rowHeight,
			colWidth,
		} = measurements;
		
		let x = Math.round(Math.round(this.sizes.marginOffset) + col * colWidth - scrollPosition.x);
		let y = (row - scrollPosition.row) * rowHeight + topMargin;
		
		return [x, y];
	}
	
	screenRowFromLineIndex(lineIndex) {
		return this.getLineStartingRow(lineIndex) - this.scrollPosition.row;
	}
};
