let screenCoordsFromCursor = require("../utils/screenCoordsFromCursor");
let calculateMarginOffset = require("./calculateMarginOffset");

module.exports = function(
	context,
	lines,
	selection,
	scrollPosition,
	measurements,
	cursorBlinkOn,
) {
	if (!cursorBlinkOn) {
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
	
	if (x >= marginOffset) {
		context.fillStyle = "black";
		context.fillRect(x, y, 1, measurements.rowHeight);
	}
}
