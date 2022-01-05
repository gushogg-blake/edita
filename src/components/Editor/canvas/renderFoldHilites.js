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
	
	let context;
	
	let leftEdge = marginOffset - scrollPosition.x;
	let rowOffset = -(scrollPosition.y % rowHeight);
	
	let y = topMargin + rowOffset;
	
	return {
		drawHilite(indentCols, lineWidth) {
			let x = Math.round(leftEdge + indentCols * colWidth);
			let width = Math.round(lineWidth * colWidth);
			
			context = layers.hilites;
			
			context.save();
			
			context.translate(0.5, 0.5);
			context.lineWidth = 1;
			context.strokeStyle = base.prefs.foldHeaderBorder;
			context.strokeRect(x - 1, y, width + 1, rowHeight - 1);
			
			context.restore();
			
			context = layers.foldHilites;
			
			context.fillStyle = base.prefs.foldHeaderBackground;
			context.fillRect(x, y, width, rowHeight);
		},
		
		endRow() {
			y += rowHeight;
		},
	};
}
