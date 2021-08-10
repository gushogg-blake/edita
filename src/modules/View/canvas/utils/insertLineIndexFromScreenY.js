let topMargin = require("../topMargin");
let cursorFromRowCol = require("./cursorFromRowCol");
let getLineStartingRow = require("./getLineStartingRow");

module.exports = function(
	wrappedLines,
	y,
	scrollPosition,
	measurements,
) {
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
