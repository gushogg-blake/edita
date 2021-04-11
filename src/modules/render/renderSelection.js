let sortSelection = require("../utils/sortSelection");
let getLineStartingRow = require("../utils/getLineStartingRow.js");
let screenCoordsFromCursor = require("../utils/screenCoordsFromCursor");
let rowColFromCursor = require("../utils/rowColFromCursor");
let screenCoordsFromRowCol = require("../utils/screenCoordsFromRowCol");

module.exports = function(
	context,
	lines,
	selection,
	scrollPosition,
	prefs,
	measurements,
) {
	context.fillStyle = prefs.selectionBackground;
	
	let {colWidth, rowHeight} = measurements;
	let {start, end} = sortSelection(selection);
	let [startLineIndex, startOffset] = start;
	let [endLineIndex, endOffset] = end;
	
	let [startRow, startCol] = rowColFromCursor(lines, startLineIndex, startOffset);
	let [endRow, endCol] = rowColFromCursor(lines, endLineIndex, endOffset);
	
	let row = startRow;
	let col = startCol;
	
	let lineStartingRow = getLineStartingRow(lines, startLineIndex);
	let innerLineIndex = startRow - lineStartingRow;
	
	for (let i = startLineIndex; i <= endLineIndex; i++) {
		let line = lines[i];
		
		for (let j = 0; j < line.height; j++) {
			if (i === startLineIndex && j < innerLineIndex) {
				continue;
			}
			
			if (startRow === endRow) {
				// single-line selection
				
				let [x, y] = screenCoordsFromRowCol(
					lines,
					startRow,
					startCol,
					scrollPosition,
					measurements,
				);
				
				let width = endCol - startCol;
				
				context.fillRect(x, y, width * colWidth, rowHeight);
				
				break;
			}
			
			if (row === endRow) {
				// last row of multi-line selection
				// highlight beginning of line to end col
				
				let [x, y] = screenCoordsFromRowCol(
					lines,
					row,
					0,
					scrollPosition,
					measurements,
				);
				
				let width = endCol;
				
				context.fillRect(x, y, width * colWidth, rowHeight);
				
				break;
			}
			
			if (row === startRow) {
				// first row of multi-line selection
				// highlight start col to end of line, plus 1 for the newline
				
				let [x, y] = screenCoordsFromRowCol(
					lines,
					startRow,
					startCol,
					scrollPosition,
					measurements,
				);
				
				let width = (
					line.height > 1
					? line.wrappedLines[j].width + line.wrapIndentCols
					: line.width
				) - startCol + 1;
				
				context.fillRect(x, y, width * colWidth, rowHeight);
			}
			
			if (row !== startRow && row !== endRow) {
				// inner row of multi-line selection
				// highlight whole line plus 1 for the newline at the end
				
				let [x, y] = screenCoordsFromRowCol(
					lines,
					row,
					0,
					scrollPosition,
					measurements,
				);
				
				let width = (
					line.height > 1
					? line.wrappedLines[j].width
					: line.width
				) + 1;
				
				if (j > 0) {
					width += line.wrapIndentCols;
				}
				
				context.fillRect(x, y, width * colWidth, rowHeight);
			}
			
			row++;
		}
	}
}
