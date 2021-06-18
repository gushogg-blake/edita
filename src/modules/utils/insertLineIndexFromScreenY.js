let topMargin = require("../render/topMargin");
let cursorFromRowCol = require("./cursorFromRowCol");
let getLineStartingRow = require("./getLineStartingRow");

module.exports = function(
	lines,
	y,
	scrollPosition,
	measurements,
) {
	let {
		rowHeight,
	} = measurements;
	
	let middle = rowHeight / 2;
	let screenRow = Math.floor((y - topMargin) / rowHeight) + scrollPosition.row;
	let offset = (y - topMargin) % rowHeight;
	let offsetFromMiddle = offset - middle;
	
	let rowAbove;
	let rowBelow;
	
	if (offset > middle) {
		rowAbove = screenRow;
		rowBelow = screenRow + 1;
	} else {
		rowAbove = screenRow - 1;
		rowBelow = screenRow;
	}
	
	let aboveLineIndex = null;
	let belowLineIndex = null;
	
	if (rowAbove >= 0) {
		([aboveLineIndex] = cursorFromRowCol(lines, rowAbove, 0));
	}
	
	if (aboveLineIndex === null || aboveLineIndex < lines.length - 1) {
		([belowLineIndex] = cursorFromRowCol(lines, rowBelow, 0));
	}
	
	if (aboveLineIndex === belowLineIndex) {
		let lineIndex = aboveLineIndex;
		let startingScreenRow = getLineStartingRow(lines, lineIndex) - scrollPosition.row;
		let startingY = topMargin + startingScreenRow * rowHeight;
		let height = lines[lineIndex].height * rowHeight;
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
