let sortSelection = require("../utils/sortSelection");
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
	
	for (let i = startLineIndex; i <= endLineIndex; i++) {
		let line = lines[i];
		
		for (let j = 0; j < line.height; j++) {
			if (startRow === endRow) {
				let [x, y] = screenCoordsFromRowCol(lines, startRow, startCol, scrollPosition, measurements);
				let width = endCol - startCol;
				
				context.fillRect(x, y, width * colWidth, rowHeight);
				
				break;
			}
			
			if (row === endRow) {
				let [x, y] = screenCoordsFromRowCol(lines, row, 0, scrollPosition, measurements);
				let width = endCol;
				
				context.fillRect(x, y, width * colWidth, rowHeight);
				
				break;
			}
			
			if (row === startRow) {
				let [x, y] = screenCoordsFromRowCol(lines, startRow, startCol, scrollPosition, measurements);
				let width = (line.height > 1 ? line.wrappedLines[j].width : line.width) - startCol;
				
				context.fillRect(x, y, width * colWidth, rowHeight);
			}
			
			if (row !== startRow && row !== endRow) {
				let width = line.height > 1 ? line.wrappedLines[j].width : line.width;
				let [x, y] = screenCoordsFromRowCol(lines, row, 0, scrollPosition, measurements);
				
				if (j > 0) {
					width += line.wrapIndentCols;
				}
				
				context.fillRect(x, y, width * colWidth, rowHeight);
			}
			
			row++;
		}
	}
}
