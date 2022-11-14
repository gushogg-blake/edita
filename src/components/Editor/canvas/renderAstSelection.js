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
			context.fillStyle = base.theme.editor.astSelectionBackground;
		},
		
		setStartLine(line) {
			startY = y;
		},
		
		setEndLine() {
			endY = y;
		},
		
		startRow() {
		},
		
		endRow() {
			y += rowHeight;
		},
		
		draw() {
			let height = endY - startY;
			
			if (height === 0) {
				context.fillRect(0, startY, width, 2);
			} else {
				context.fillRect(0, startY, width, height);
			}
		},
	};
}
