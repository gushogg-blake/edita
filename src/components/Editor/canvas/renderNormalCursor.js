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
	
	let [x, y] = view.screenCoordsFromCursor(normalSelection.end);
	
	if (x < view.sizes.marginWidth) {
		return;
	}
	
	context.fillStyle = "black";
	context.fillRect(x, y, 1, measurements.rowHeight);
}
