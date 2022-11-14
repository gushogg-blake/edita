module.exports = function(layers, view, offsets) {
	let {
		sizes: {width},
		measurements: {rowHeight},
	} = view;
	
	let context = layers.hilites;
	
	let y = offsets.rowOffset;
	
	let startY;
	let endY;
	
	return {
		init() {
			context.fillStyle = base.theme.editor.astSelectionHiliteBackground;
		},
		
		setStartLine(line) {
			//x = Math.max(0, leftEdge + line.indentCols * colWidth);
			startY = y;
		},
		
		setEndLine() {
		},
		
		startRow() {
		},
		
		endRow() {
			y += rowHeight;
		},
		
		draw() {
			if (height === 0) {
				context.fillRect(0, y, width, 2);
			} else {
				context.fillRect(0, y, width, height);
			}
		},
	};
}
