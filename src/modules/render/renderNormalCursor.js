let screenCoordsFromCursor = require("../utils/screenCoordsFromCursor");
let calculateMarginOffset = require("./calculateMarginOffset");

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
	
	let marginOffset = calculateMarginOffset(lines, measurements);
	
	context.fillStyle = "black";
	context.fillRect(x + xHint, y, 1, measurements.rowHeight);
}
