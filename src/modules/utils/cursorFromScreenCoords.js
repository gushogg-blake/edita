let rowColFromScreenCoords = require("./rowColFromScreenCoords");
let cursorFromRowCol = require("./cursorFromRowCol");

module.exports = function(
	lines,
	x,
	y,
	scrollPosition,
	measurements,
) {
	let [row, col] = rowColFromScreenCoords(lines, x, y, scrollPosition, measurements);
	
	return cursorFromRowCol(lines, row, col);
}
