module.exports = function(layers, view) {
	let {
		insertCursor,
		measurements,
	} = view;
	
	if (!insertCursor) {
		return;
	}
	
	let [x, y] = view.screenCoordsFromCursor(insertCursor);
	
	if (x < view.sizes.marginOffset) {
		return;
	}
	
	let context = layers.hilites;
	
	context.fillStyle = base.theme.cursorColor;
	context.fillRect(x, y, 1, measurements.rowHeight);
}
