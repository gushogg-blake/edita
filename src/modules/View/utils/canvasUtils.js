let Selection = require("modules/utils/Selection");
let expandTabs = require("modules/utils/string/expandTabs");

module.exports = {
	calculateNormalSelectionRegions(selection) {
		let regions = [];
		
		let {colWidth, rowHeight} = this.measurements;
		let {start, end} = Selection.sort(selection);
		
		let [startRow, startCol] = this.rowColFromCursor(start);
		let [endRow, endCol] = this.rowColFromCursor(end);
		
		let row = startRow;
		let col = startCol;
		
		let lineStartingRow = this.getLineStartingRow(start.lineIndex);
		let lineRowIndex = startRow - lineStartingRow;
		
		let startScreenRow = startRow - this.scrollPosition.row;
		
		for (let i = start.lineIndex; i <= end.lineIndex; i++) {
			let wrappedLine = this.wrappedLines[i];
			let {line} = wrappedLine;
			
			for (let j = 0; j < wrappedLine.height; j++) {
				if (i === start.lineIndex && j < lineRowIndex) {
					continue;
				}
				
				if (startRow === endRow) {
					// single-line selection
					
					let [x, y] = this.screenCoordsFromRowCol(startRow, startCol);
					
					let width = endCol - startCol;
					
					regions.push([x, y, width * colWidth, rowHeight]);
					
					break;
				}
				
				if (row === endRow) {
					// last row of multi-line selection
					// highlight beginning of line to end col
					
					let [x, y] = this.screenCoordsFromRowCol(row, 0);
					
					let width = endCol;
					
					regions.push([x, y, width * colWidth, rowHeight]);
					
					break;
				}
				
				if (row === startRow) {
					// first row of multi-line selection
					// highlight start col to end of line, plus 1 for the newline
					
					let [x, y] = this.screenCoordsFromRowCol(startRow, startCol);
					
					let width = wrappedLine.rows[j].width - startCol + 1;
					
					if (j > 0) {
						width += line.indentCols;
					}
					
					regions.push([x, y, width * colWidth, rowHeight]);
				}
				
				if (row !== startRow && row !== endRow) {
					// inner row of multi-line selection
					// highlight whole line plus 1 for the newline at the end
					
					let [x, y] = this.screenCoordsFromRowCol(row, 0);
					
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
	},
	
	countRows() {
		let rows = 0;
		
		for (let wrappedLine of this.wrappedLines) {
			rows += wrappedLine.height;
		}
		
		return rows;
	},
	
	cursorFromRowCol(row, col, beforeTab=false) {
		let lineIndex = 0;
		let offset = 0;
		let r = 0;
		
		for (let i = 0; i < this.wrappedLines.length - 1; i++) {
			let {height} = this.wrappedLines[i];
			
			if (r + height > row) {
				break;
			}
			
			r += height;
			lineIndex++;
		}
		
		lineIndex = Math.min(lineIndex, this.wrappedLines.length - 1);
		
		let wrappedLine = this.wrappedLines[lineIndex];
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
	},
	
	cursorFromScreenCoords(x, y) {
		return cursorFromRowCol(...this.cursorRowColFromScreenCoords(x, y));
	},
	
	findFirstVisibleLine() {
		let row = 0;
		
		for (let i = 0; i < this.wrappedLines.length; i++) {
			let wrappedLine = this.wrappedLines[i];
			
			if (row + wrappedLine.height > this.scrollPosition.row) {
				return {
					wrappedLine,
					lineIndex: i,
					rowIndex: this.scrollPosition.row - row,
				};
			}
			
			row += wrappedLine.height;
		}
		
		return null;
	},
	
	// returns the index to slice at (index of the last visible line + 1)
	
	findLastVisibleLineIndex(firstVisibleLine) {
		let {height} = this.sizes;
		let {rowHeight} = this.measurements;
		let rowsToRender = Math.ceil(height / rowHeight);
		let rowsRendered = this.wrappedLines[firstVisibleLine.lineIndex].height - firstVisibleLine.rowIndex;
		let lineIndex = firstVisibleLine.lineIndex + 1;
		
		while (rowsRendered < rowsToRender && lineIndex < this.wrappedLines.length) {
			rowsRendered += this.wrappedLines[lineIndex].height;
			lineIndex++;
		}
		
		return lineIndex;
	},
	
	getLineRangeTotalHeight(startLineIndex, endLineIndex) {
		let height = 0;
		
		for (let i = startLineIndex; i <= endLineIndex; i++) {
			height += this.wrappedLines[i].height;
		}
		
		return height;
	},
	
	getLineStartingRow(lineIndex) {
		let startingRow = 0;
		
		for (let i = 0; i < this.wrappedLines.length; i++) {
			if (i === lineIndex) {
				break;
			}
			
			startingRow += this.wrappedLines[i].height;
		}
		
		return startingRow;
	},
	
	innerLineIndexAndOffsetFromCursor(lineIndex, offset) {
		let {lineIndex, offset} = cursor;
		let wrappedLine = this.wrappedLines[lineIndex];
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
	},
	
	insertLineIndexFromScreenY(y) {
		let {
			rowHeight,
		} = this.measurements;
		
		y -= this.topMargin;
		
		let middle = rowHeight / 2;
		let screenRow = Math.floor(y / rowHeight) + this.scrollPosition.row;
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
				aboveLineIndex = this.cursorFromRowCol(rowAbove, 0).lineIndex;
			}
			
			if (aboveLineIndex === null || aboveLineIndex < this.wrappedLines.length - 1) {
				belowLineIndex = this.cursorFromRowCol(rowBelow, 0).lineIndex;
			}
		}
		
		if (aboveLineIndex === belowLineIndex) {
			let lineIndex = aboveLineIndex;
			let startingScreenRow = this.getLineStartingRow(lineIndex) - this.scrollPosition.row;
			let startingY = startingScreenRow * rowHeight;
			let height = this.wrappedLines[lineIndex].height * rowHeight;
			let middle = height / 2;
			let offset = y - startingY;
			
			offsetFromMiddle = offset - middle;
		}
		
		return {
			aboveLineIndex,
			belowLineIndex,
			offset: offsetFromMiddle / middle,
		};
	},
	
	rowColFromCursor(cursor) {
		let {lineIndex, offset} = cursor;
		let row = 0;
		
		for (let i = 0; i < lineIndex; i++) {
			row += this.wrappedLines[i].height;
		}
		
		let wrappedLine = this.wrappedLines[lineIndex];
		
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
	},
	
	rowColFromScreenCoords(x, y) {
		let {
			rowHeight,
			colWidth,
		} = measurements;
		
		let coordsXHint = 2;
		
		let screenCol = Math.floor((x - this.sizes.marginOffset + coordsXHint + this.scrollPosition.x) / colWidth);
		let screenRow = Math.floor((y - this.topMargin) / rowHeight) + this.scrollPosition.row;
		
		return [
			Math.max(0, screenRow),
			Math.max(0, screenCol),
		];
	},
	
	cursorRowColFromScreenCoords(x, y) {
		let {
			rowHeight,
			colWidth,
		} = this.measurements;
		
		let coordsXHint = 2;
		
		let screenCol = Math.round((x - this.sizes.marginOffset + coordsXHint + this.scrollPosition.x) / colWidth);
		let screenRow = Math.floor((y - this.topMargin) / rowHeight) + this.scrollPosition.row;
		
		return [
			Math.max(0, screenRow),
			Math.max(0, screenCol),
		];
	},
	
	screenCoordsFromCursor(cursor) {
		return this.screenCoordsFromRowCol(...this.rowColFromCursor(cursor));
	},
	
	screenCoordsFromRowCol(row, col) {
		let {rowHeight, colWidth} = this.measurements;
		
		let x = Math.round(Math.round(this.sizes.marginOffset) + col * colWidth - this.scrollPosition.x);
		let y = (row - this.scrollPosition.row) * rowHeight + this.topMargin;
		
		return [x, y];
	},
	
	screenRowFromLineIndex(lineIndex) {
		return this.getLineStartingRow(lineIndex) - this.scrollPosition.row;
	},
};
