let calculateMarginOffset = require("../render/calculateMarginOffset");

let coordsXHint = 2;

module.exports = function(
	lines,
	x,
	y,
	scrollPosition,
	measurements,
) {
	let {
		rowHeight,
		colWidth,
	} = measurements;
	
	let marginOffset = calculateMarginOffset(lines, measurements);
	
	
	let screenCol = Math.round((x - marginOffset + coordsXHint + scrollPosition.x) / colWidth);
	let screenRow = Math.floor(y / rowHeight) + scrollPosition.row;
	
	return [
		screenRow,
		screenCol,
	];
}
