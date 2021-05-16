let screenCoordsFromCursor = require("../utils/screenCoordsFromCursor.js");

let xHint = -1;

module.exports = function(
	context,
	lines,
	selection,
	scrollPosition,
	measurements,
	cursorBlinkOn,
	windowHasFocus,
) {
	if (!cursorBlinkOn || !windowHasFocus) {
		return;
	}
	
	let [lineIndex, offset] = selection.end;
	
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
