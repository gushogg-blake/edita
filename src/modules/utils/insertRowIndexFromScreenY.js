let topMargin = require("../render/topMargin");

module.exports = function(
	screenY,
	scrollPosition,
	measurements,
) {
	let {
		rowHeight,
	} = measurements;
	
	let middle = rowHeight / 2;
	let screenRow = Math.floor((screenY - topMargin + middle) / rowHeight) + scrollPosition.row;
	
	return Math.max(0, screenRow);
}
