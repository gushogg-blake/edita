let topMargin = require("../topMargin");
let calculateMarginOffset = require("./calculateMarginOffset");

module.exports = function(
	wrappedLines,
	row,
	col,
	scrollPosition,
	measurements,
) {
	let {
		rowHeight,
		colWidth,
	} = measurements;
	
	let marginOffset = Math.round(calculateMarginOffset(wrappedLines, measurements));
	
	let x = Math.round(marginOffset + col * colWidth - scrollPosition.x);
	let y = (row - scrollPosition.row) * rowHeight + topMargin;
	
	return [x, y];
}
