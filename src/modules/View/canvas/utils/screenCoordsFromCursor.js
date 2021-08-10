let rowColFromCursor = require("./rowColFromCursor");
let screenCoordsFromRowCol = require("./screenCoordsFromRowCol");

module.exports = function(
	lines,
	cursor,
	scrollPosition,
	measurements,
) {
	let [row, col] = rowColFromCursor(lines, cursor);
	
	return screenCoordsFromRowCol(lines, row, col, scrollPosition, measurements);
}
	