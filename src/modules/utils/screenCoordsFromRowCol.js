let calculateMarginOffset = require("../render/calculateMarginOffset");
let topPadding = require("../render/topPadding");

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
	let y = (row - scrollPosition.row) * rowHeight + topPadding;
	
	return [x, y];
}
