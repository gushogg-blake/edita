let cursorRowColFromScreenCoords = require("./cursorRowColFromScreenCoords");
let cursorFromRowCol = require("./cursorFromRowCol");

module.exports = function(
	lines,
	x,
	y,
	scrollPosition,
	measurements,
) {
	let [row, col] = cursorRowColFromScreenCoords(lines, x, y, scrollPosition, measurements);
	
	return cursorFromRowCol(lines, row, col);
}
