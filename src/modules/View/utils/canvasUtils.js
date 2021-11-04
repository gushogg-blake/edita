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
		
		lines: for (let i = start.lineIndex; i <= end.lineIndex; i++) {
			let wrappedLine = this.wrappedLines[i];
			let {line} = wrappedLine;
			
			for (let j = 0; j < wrappedLine.height; j++) {
				if (i === start.lineIndex && j < lineRowIndex) {
					continue;
				}
				
				if (startRow === endRow) {
					// single-row selection
					
					let [x, y] = this.screenCoordsFromRowCol(startRow, startCol);
					
					let width = endCol - startCol;
					
					regions.push([x, y, width * colWidth, rowHeight]);
					
					break;
				}
				
				if (row === endRow) {
					// last row of multi-row selection
					// highlight beginning of line to end col
					
					let [x, y] = this.screenCoordsFromRowCol(row, 0);
					
					let width = endCol;
					
					regions.push([x, y, width * colWidth, rowHeight]);
					
					break;
				}
				
				if (row === startRow) {
					// first row of multi-row selection
					// highlight start col to end of line, plus 1 for the newline
					
					let [x, y] = this.screenCoordsFromRowCol(startRow, startCol);
					
					let width = wrappedLine.lineRows[j].width - startCol + (i < end.lineIndex && j === wrappedLine.lineRows.length - 1 ? 1 : 0);
					
					if (j > 0) {
						width += line.indentCols;
					}
					
					regions.push([x, y, width * colWidth, rowHeight]);
				}
				
				if (row !== startRow && row !== endRow) {
					// inner row of multi-line selection
					// highlight whole line plus 1 for the newline at the end
					
					let [x, y] = this.screenCoordsFromRowCol(row, 0);
					
					let width = wrappedLine.lineRows[j].width + (i < end.lineIndex && j === wrappedLine.lineRows.length - 1 ? 1 : 0);
					
					if (j > 0) {
						width += line.indentCols;
					}
					
					regions.push([x, y, width * colWidth, rowHeight]);
				}
				
				row++;
				
				if (this.folds[i]) {
					i = this.folds[i] - 1;
					
					continue lines;
				}
			}
		}
		
		return regions;
	},
	
	countLineRowsFolded() {
		let rows = 0;
		
		for (let lineRow of this.generateLineRowsFolded()) {
			
		}
		for (let wrappedLine of this.wrappedLines) {
			rows += wrappedLine.height;
		}
		
		return rows;
	},
	
	cursorFromRowCol(row, col, beforeTab=false) {
		let rowsCounted = 0;
		let foldedLineRow;
		
		for (foldedLineRow of this.generateLineRowsFolded()) {
			if (rowsCounted === row) {
				break;
			}
			
			rowsCounted++;
		}
		
		let {
			lineRow,
			lineIndex,
			wrappedLine,
			rowIndexInLine,
		} = foldedLineRow;
		
		lineIndex = Math.min(lineIndex, this.wrappedLines.length - 1);
		
		if (row - rowsCounted > 0) { // mouse is below text
			return {
				lineIndex,
				offset: wrappedLine.line.string.length,
			};
		}
		
		let offset = lineRow.startOffset;
		
		if (rowIndexInLine > 0) {
			col -= wrappedLine.line.indentCols;
			
			if (col < 0) {
				col = 0;
			}
		}
		
		// consume chars until c is col
		
		let c = 0;
		
		for (let part of lineRow.variableWidthParts) {
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
	
	*generateLineRowsFolded(startLineIndex=0) {
		let lineIndex = startLineIndex;
		
		while (lineIndex < this.wrappedLines.length) {
			let wrappedLine = this.wrappedLines[lineIndex];
			let {line} = wrappedLine;
			let foldEndLineIndex = this.folds[lineIndex];
			let isFoldHeader = !!foldEndLineIndex;
			
			let rowIndexInLine = 0;
			
			for (let lineRow of wrappedLine.lineRows) {
				yield {
					isFoldHeader,
					lineIndex,
					rowIndexInLine,
					wrappedLine,
					line,
					lineRow,
				};
				
				rowIndexInLine++;
				
				if (isFoldHeader) {
					break;
				}
			}
			
			if (isFoldHeader) {
				lineIndex = foldEndLineIndex;
				
				continue;
			}
			
			lineIndex++;
		}
	},
	
	*generateWrappedLinesFolded(startLineIndex=0) {
		let lineIndex = startLineIndex;
		
		while (lineIndex < this.wrappedLines.length) {
			let wrappedLine = this.wrappedLines[lineIndex];
			let {line} = wrappedLine;
			let foldEndLineIndex = this.folds[lineIndex];
			let isFoldHeader = !!foldEndLineIndex;
			
			yield {
				isFoldHeader,
				lineIndex,
				wrappedLine,
				height: isFoldHeader ? 1 : wrappedLine.height,
			};
			
			if (isFoldHeader) {
				lineIndex = foldEndLineIndex;
				
				continue;
			}
			
			lineIndex++;
		}
	},
	
	findFirstVisibleLine() {
		let {rowHeight} = this.measurements;
		let scrollRow = Math.floor(this.scrollPosition.y / rowHeight);
		let rowIndex = 0;
		
		for (let {lineIndex, wrappedLine} of this.generateWrappedLinesFolded()) {
			if (rowIndex + wrappedLine.height > scrollRow) {
				return {
					wrappedLine,
					lineIndex,
					rowIndexInLine: scrollRow - rowIndex,
				};
			}
			
			rowIndex += wrappedLine.height;
		}
		
		return null;
	},
	
	getLineRangeTotalHeight(startLineIndex, endLineIndex) {
		let height = 0;
		
		for (let i = startLineIndex; i <= endLineIndex; i++) {
			height += this.wrappedLines[i].height;
		}
		
		return height;
	},
	
	getLineStartingRow(lineIndex) { // TODO use generateLineRowsFolded
		let startingRow = 0;
		
		for (let i = 0; i < this.wrappedLines.length; i++) {
			if (i === lineIndex) {
				break;
			}
			
			startingRow += this.wrappedLines[i].height;
		}
		
		return startingRow;
	},
	
	lineRowIndexAndOffsetFromCursor(cursor) {
		let {lineIndex, offset} = cursor;
		let wrappedLine = this.wrappedLines[lineIndex];
		let lineRowIndex = 0;
		let offsetInRow = offset;
		
		for (let i = 0; i < wrappedLine.height; i++) {
			let lineRow = wrappedLine.lineRows[i];
			
			if (wrappedLine.height > 1 && i !== wrappedLine.height - 1) {
				if (offsetInRow < lineRow.string.length) {
					break;
				}
			} else {
				if (offsetInRow <= lineRow.string.length) {
					break;
				}
			}
			
			lineRowIndex++;
			offsetInRow -= lineRow.string.length;
		}
		
		return [lineRowIndex, offsetInRow];
	},
	
	insertLineIndexFromScreenY(y) {
		let {rowHeight} = this.measurements;
		
		y -= this.topMargin;
		
		let scrollOffset = this.scrollPosition.y % rowHeight;
		let middle = (rowHeight / 2);
		let row = Math.floor((y + this.scrollPosition.y) / rowHeight);
		let offset = (y + scrollOffset) % rowHeight;
		let offsetFromMiddle = offset - middle;
		
		let aboveLineIndex = null;
		let belowLineIndex = null;
		
		if (y < middle) {
			belowLineIndex = 0;
		} else {
			let rowAbove;
			let rowBelow;
			
			if (offset > middle) {
				rowAbove = row;
				rowBelow = row + 1;
			} else {
				rowAbove = row - 1;
				rowBelow = row;
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
			let startingY = this.getLineStartingRow(lineIndex) * rowHeight - this.scrollPosition.y;
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
		
		for (let foldedLineRow of this.generateLineRowsFolded()) {
			if (foldedLineRow.lineIndex === lineIndex) {
				break;
			}
			
			row++;
		}
		
		let wrappedLine = this.wrappedLines[lineIndex];
		
		let lineRowIndex = 0;
		let lineRow;
		let innerOffset = offset;
		
		for (let i = 0; i < wrappedLine.height; i++) {
			lineRow = wrappedLine.lineRows[i];
			
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
		} = this.measurements;
		
		let coordsXHint = 2;
		
		let screenCol = Math.floor((x - this.sizes.marginOffset + coordsXHint + this.scrollPosition.x) / colWidth);
		let screenRow = Math.floor((y - this.topMargin + this.scrollPosition.y) / rowHeight);
		
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
		let screenRow = Math.floor((y - this.topMargin + this.scrollPosition.y) / rowHeight);
		
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
		let y = row * rowHeight + this.topMargin - this.scrollPosition.y;
		
		return [x, y];
	},
	
	screenYFromLineIndex(lineIndex) {
		return this.getLineStartingRow(lineIndex) * this.measurements.rowHeight - this.scrollPosition.y;
	},
};
