let Selection = require("modules/utils/Selection");
let rowColFromCursor = require("./rowColFromCursor");
let getLineStartingRow = require("./getLineStartingRow");
let screenCoordsFromCursor = require("./screenCoordsFromCursor");
let screenCoordsFromRowCol = require("./screenCoordsFromRowCol");

module.exports = function(wrappedLines, selection, scrollPosition, measurements) {
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
