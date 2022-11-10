module.exports = function(layers, view) {
	let {
		sizes: {topMargin, marginWidth, marginOffset},
		measurements: {colWidth, rowHeight},
		scrollPosition,
	} = view;
	
	let context = layers.code;
	
	let leftEdge = marginOffset - scrollPosition.x;
	let rowOffset = -(scrollPosition.y % rowHeight);
	
	let y = topMargin + rowOffset;
	let col;
	
	return {
		init() {
			context.fillStyle = base.theme.editor.cursorColor;
		},
		
		startRow(wrapIndentCols) {
			col = wrapIndentCols;
		},
		
		endRow() {
			y += rowHeight;
		},
		
		skipText(cols) {
			col += cols;
		},
		
		draw() {
			context.fillRect(Math.round(leftEdge + col * colWidth), y, 1, rowHeight);
		},
	};
}
