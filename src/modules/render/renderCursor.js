let screenCoordsFromCursor = require("../utils/screenCoordsFromCursor");

module.exports = function(
	context,
	lines,
	selection,
	scrollPosition,
	measurements,
	cursorBlinkOn,
) {
	let [lineIndex, offset] = selection.end;
	
	let [x, y] = screenCoordsFromCursor(
		lines,
		lineIndex,
		offset,
		scrollPosition,
		measurements,
	);
	
	console.log(x, y);
}
