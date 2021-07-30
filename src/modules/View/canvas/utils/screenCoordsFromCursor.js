let rowColFromCursor = require("./rowColFromCursor");
let screenCoordsFromRowCol = require("./screenCoordsFromRowCol");

module.exports = function(
	lines,
	lineIndex,
	offset,
	scrollPosition,
	measurements,
) {
	let [row, col] = rowColFromCursor(lines, lineIndex, offset);
	
	return screenCoordsFromRowCol(lines, row, col, scrollPosition, measurements);
}
	