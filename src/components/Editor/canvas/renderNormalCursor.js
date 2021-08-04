let xHint = -1;

module.exports = function(context, view, windowHasFocus) {
	let {
		normalSelection,
		insertCursor,
		measurements,
		cursorBlinkOn,
	} = view;
	
	if (!cursorBlinkOn || !windowHasFocus || insertCursor) {
		return;
	}
	
	let [lineIndex, offset] = normalSelection.end;
	
	let [x, y] = view.screenCoordsFromCursor(lineIndex, offset);
	
	if (x < view.sizes.marginOffset) {
		return;
	}
	
	context.fillStyle = "black";
	context.fillRect(x + xHint, y, 1, measurements.rowHeight);
}
