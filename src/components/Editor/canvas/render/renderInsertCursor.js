let screenCoordsFromCursor = require("../utils/screenCoordsFromCursor");

let xHint = -1;

module.exports = function(
	context,
	lines,
	insertCursor,
	scrollPosition,
	measurements,
) {
	if (!insertCursor) {
		return;
	}
	
	let [lineIndex, offset] = insertCursor;
	
	let [x, y] = screenCoordsFromCursor(
		lines,
		lineIndex,
		offset,
		scrollPosition,
		measurements,
	);
	
	context.fillStyle = "black";
	context.fillRect(x + xHint, y, 1, measurements.rowHeight);
}
