module.exports = function(layers, view) {
	let {
		sizes,
		measurements,
		scrollPosition,
	} = view;
	
	let {
		colWidth,
		rowHeight,
	} = measurements;
	
	let {
		codeWidth,
		topMargin,
		marginOffset,
	} = sizes;
	
	let context = layers.foldHilites;
	
	let leftEdge = marginOffset - scrollPosition.x;
	let rowOffset = -(scrollPosition.y % rowHeight);
	
	let y = topMargin + rowOffset;
	
	return {
		drawHilite(indentCols) {
			context.fillStyle = platform.prefs.foldHeaderBackground;
			context.fillRect(leftEdge + indentCols * colWidth, y, codeWidth, rowHeight);
		},
		
		endRow() {
			y += rowHeight;
		},
	};
}
