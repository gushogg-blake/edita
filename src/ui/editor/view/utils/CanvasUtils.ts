import {type Cursor, c} from "core";
import {expandTabs} from "modules/utils/editing";
import type {View, ViewLine, WrappedLine, LineRow} from "ui/editor/view";

/*
"folded" in FoldedLineRow and FoldedWrappedLine means taking
folds into account -- the item/s returned are not necessarily
folded in the sense of being inside a fold or being a fold
header.
*/

export type FoldedLineRow = {
	isFoldHeader: boolean;
	lineIndex: number;
	rowIndexInLine: number;
	wrappedLine: WrappedLine;
	viewLine: ViewLine;
	lineRow: LineRow;
};

export type FoldedWrappedLine = {
	isFoldHeader: boolean;
	lineIndex: number;
	wrappedLine: WrappedLine;
};

/*
describes the first visible line in the document. used as
the starting point for rendering
*/

export type FirstVisibleLine = {
	wrappedLine: WrappedLine;
	lineIndex: number;
	rowIndexInLine: number;
};

/*
for AST mouse actions
*/

export type InsertLineIndex = {
	aboveLineIndex: number | null;
	belowLineIndex: number | null;
	offset: number;
};

export type RowCol = {
	row: number;
	col: number;
};

export type Coords = {
	x: number;
	y: number;
};

export default class {
	private view: View;
	
	constructor(view: View) {
		this.view = view;
	}
	
	get wrappedLines() {
		return this.view.wrappedLines;
	}
	
	get document() {
		return this.view.document;
	}
	
	get measurements() {
		return this.view.measurements;
	}
	
	get sizes() {
		return this.view.sizes;
	}
	
	get scrollPosition() {
		return this.view.scrollPosition;
	}
	
	get folds() {
		return this.view.folds;
	}
	
	countLineRowsFolded() {
		let rows = 0;
		
		for (let lineRow of this.generateLineRowsFolded()) {
			rows++;
		}
		
		return rows;
	}
	
	cursorFromRowCol({row, col}: RowCol, beforeTab: boolean = false): Cursor {
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
			return c(lineIndex, wrappedLine.line.string.length);
		}
		
		let offset = lineRow.startOffset;
		
		if (rowIndexInLine > 0) {
			col -= wrappedLine.line.indentCols;
			
			if (col < 0) {
				col = 0;
			}
		}
		
		// consume chars until c is col
		
		let currentCol = 0;
		
		for (let part of lineRow.variableWidthParts) {
			if (currentCol === col) {
				break;
			}
			
			if (part.type === "tab") {
				let {width} = part;
				
				if (currentCol + width > col) {
					// the col is within the tab
					// if more than half way go to after the tab
					// otherwise stay before it
					
					if (!beforeTab && col - currentCol > width / 2) {
						offset++;
					}
					
					break;
				}
				
				currentCol += width;
				offset++;
			} else if (part.type === "string") {
				let {string} = part;
				
				if (currentCol + string.length > col) {
					// col is within the current string
					// add the remaining cols to the offset
					
					offset += col - currentCol;
					
					break;
				}
				
				currentCol += string.length;
				offset += string.length;
			}
		}
		
		if (rowIndexInLine < wrappedLine.height - 1 && offset === lineRow.startOffset + lineRow.string.length) {
			offset--;
		}
		
		return c(lineIndex, offset);
	}
	
	cursorFromScreenCoords(coords: Coords): Cursor {
		return this.cursorFromRowCol(this.cursorRowColFromScreenCoords(coords));
	}
	
	*generateLineRowsFolded(startLineIndex: number = 0): Generator<FoldedLineRow> {
		let lineIndex = startLineIndex;
		
		while (lineIndex < this.wrappedLines.length && `spincheck=${1000000}`) {
			let wrappedLine = this.wrappedLines[lineIndex];
			let {viewLine} = wrappedLine;
			let foldEndLineIndex = this.folds[lineIndex];
			let isFoldHeader = !!foldEndLineIndex;
			
			let rowIndexInLine = 0;
			
			for (let lineRow of wrappedLine.lineRows) {
				yield {
					isFoldHeader,
					lineIndex,
					rowIndexInLine,
					wrappedLine,
					viewLine,
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
	}
	
	*generateWrappedLinesFolded(startLineIndex: number = 0): Generator<FoldedWrappedLine> {
		let lineIndex = startLineIndex;
		
		while (lineIndex < this.wrappedLines.length && `spincheck=${1000000}`) {
			let wrappedLine = this.wrappedLines[lineIndex];
			let {viewLine} = wrappedLine;
			let foldEndLineIndex = this.folds[lineIndex];
			let isFoldHeader = !!foldEndLineIndex;
			
			yield {
				isFoldHeader,
				lineIndex,
				wrappedLine,
			};
			
			if (isFoldHeader) {
				lineIndex = foldEndLineIndex;
				
				continue;
			}
			
			lineIndex++;
		}
	}
	
	findFirstVisibleLine(): FirstVisibleLine {
		let {rowHeight} = this.measurements;
		let scrollY = Math.max(0, this.scrollPosition.y - this.sizes.topMargin);
		let scrollRow = Math.floor(scrollY / rowHeight);
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
		
		throw new Error("findFirstVisibleLine - no line found, scroll position possibly out of bounds");
	}
	
	getLineStartingRow(lineIndex: number): number {
		let startingRow = 0;
		
		for (let foldedLineRow of this.generateLineRowsFolded()) {
			if (foldedLineRow.lineIndex === lineIndex) {
				return startingRow;
			}
			
			startingRow++;
		}
		
		return startingRow;
	}
	
	lineRowIndexAndOffsetFromCursor(cursor: Cursor): {lineRowIndex: number, offsetInRow: number} {
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
		
		return {lineRowIndex, offsetInRow};
	}
	
	insertLineIndexFromScreenY(y: number): InsertLineIndex {
		let {rowHeight} = this.measurements;
		
		y -= this.sizes.topMargin;
		
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
				aboveLineIndex = this.cursorFromRowCol({row: rowAbove, col: 0}).lineIndex;
			}
			
			if (aboveLineIndex === null || aboveLineIndex < this.wrappedLines.length - 1) {
				belowLineIndex = this.cursorFromRowCol({row: rowBelow, col: 0}).lineIndex;
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
	}
	
	rowColFromCursor(cursor: Cursor): RowCol {
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
		
		let col = expandTabs(lineRow.string.substr(0, innerOffset), this.document.format).length;
		
		if (lineRowIndex > 0) {
			col += wrappedLine.line.indentCols;
		}
		
		return {row, col};
	}
	
	rowColFromScreenCoords({x, y}: Coords): RowCol {
		let {
			rowHeight,
			colWidth,
		} = this.measurements;
		
		let coordsXHint = 2;
		
		let screenCol = Math.floor((x - this.sizes.marginOffset + coordsXHint + this.scrollPosition.x) / colWidth);
		let screenRow = Math.floor((y - this.sizes.topMargin + this.scrollPosition.y) / rowHeight);
		
		return {
			row: Math.max(0, screenRow),
			col: Math.max(0, screenCol),
		};
	}
	
	cursorRowColFromScreenCoords({x, y}: Coords): RowCol {
		let {
			rowHeight,
			colWidth,
		} = this.measurements;
		
		let coordsXHint = 2;
		
		let screenCol = Math.round((x - this.sizes.marginOffset + coordsXHint + this.scrollPosition.x) / colWidth);
		let screenRow = Math.floor((y - this.sizes.topMargin + this.scrollPosition.y) / rowHeight);
		
		return {
			row: Math.max(0, screenRow),
			col: Math.max(0, screenCol),
		};
	}
	
	screenCoordsFromCursor(cursor: Cursor): Coords {
		return this.screenCoordsFromRowCol(this.rowColFromCursor(cursor));
	}
	
	screenCoordsFromRowCol({row, col}: RowCol): Coords {
		let {rowHeight, colWidth} = this.measurements;
		
		let x = Math.round(Math.round(this.sizes.marginOffset) + col * colWidth - this.scrollPosition.x);
		let y = row * rowHeight + this.sizes.topMargin - this.scrollPosition.y;
		
		return {x, y};
	}
	
	screenYFromLineIndex(lineIndex: number): number {
		return this.getLineStartingRow(lineIndex) * this.measurements.rowHeight - this.scrollPosition.y;
	}
}
