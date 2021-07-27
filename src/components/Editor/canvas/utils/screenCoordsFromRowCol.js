let topMargin = require("../topMargin");
let calculateMarginOffset = require("./calculateMarginOffset");

module.exports = function(
	lines,
	row,
	col,
	scrollPosition,
	measurements,
) {
	let {
		rowHeight,
		colWidth,
	} = measurements;
	
	let marginOffset = Math.round(calculateMarginOffset(lines, measurements));
	
	let x = Math.round(marginOffset + col * colWidth - scrollPosition.x);
	let y = (row - scrollPosition.row) * rowHeight + topMargin;
	
	return [x, y];
}
