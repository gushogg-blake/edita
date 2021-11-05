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
		topMargin,
		marginOffset,
	} = sizes;
	
	let context = layers.foldHilites;
	
	let leftEdge = marginOffset - scrollPosition.x;
	let rowOffset = -(scrollPosition.y % rowHeight);
	
	let y = topMargin + rowOffset;
	
	return {
		drawHilite(indentCols, lineWidth) {
			let x = Math.round(leftEdge + indentCols * colWidth);
			let width = lineWidth * colWidth;
			
			context.fillStyle = "#b0b0b0";
			context.strokeRect(x, y, width, rowHeight);
			
			context.fillStyle = platform.prefs.foldHeaderBackground;
			context.fillRect(x, y, width, rowHeight);
		},
		
		endRow() {
			y += rowHeight;
		},
	};
}
