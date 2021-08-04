let xHint = -1;

module.exports = function(context, view) {
	let {
		insertCursor,
		measurements,
	} = view;
	
	if (!insertCursor) {
		return;
	}
	
	let [lineIndex, offset] = insertCursor;
	
	let [x, y] = view.screenCoordsFromCursor(lineIndex, offset);
	
	if (x < view.sizes.marginOffset) {
		return;
	}
	
	context.fillStyle = "black";
	context.fillRect(x + xHint, y, 1, measurements.rowHeight);
}
