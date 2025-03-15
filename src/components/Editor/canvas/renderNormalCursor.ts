module.exports = function(layers, view, offsets) {
	let {
		measurements: {colWidth, rowHeight},
	} = view;
	
	let context = layers.code;
	
	let {leftEdge, rowOffset} = offsets;
	
	let y = rowOffset;
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
