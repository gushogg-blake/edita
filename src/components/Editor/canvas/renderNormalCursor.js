module.exports = function(layers, view, windowHasFocus) {
	let {
		sizes: {topMargin, marginWidth, marginOffset},
		measurements: {colWidth, rowHeight},
		scrollPosition,
	} = view;
	
	let context = layers.code;
	
	let leftEdge = marginOffset - scrollPosition.x;
	let rowOffset = -(scrollPosition.y % rowHeight);
	
	let x;
	let y = topMargin + rowOffset;
	let col;
	
	let startY;
	let endY;
	
	return {
		init() {
			context.fillStyle = base.theme.editor.cursorColor;
		},
		
		startRow(wrapIndentCols) {
			x = leftEdge;
			col = wrapIndentCols;
		},
		
		endRow() {
			y += rowHeight;
		},
		
		skipText(cols) {
			col += cols;
		},
		
		draw() {
			context.fillRect(Math.round(x + col * colWidth), y, 1, rowHeight);
		},
	};
}
