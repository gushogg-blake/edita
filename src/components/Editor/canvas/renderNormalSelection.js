module.exports = function(layers, view) {
	let {
		sizes: {topMargin, marginWidth, marginOffset},
		measurements: {colWidth, rowHeight},
		scrollPosition,
	} = view;
	
	let context = layers.hilites;
	
	//let leftEdge = marginOffset - scrollPosition.x;
	let rowOffset = -(scrollPosition.y % rowHeight);
	
	//let x;
	let y = topMargin + rowOffset;
	
	let startY;
	let endY;
	
	return {
		init() {
			context.fillStyle = base.theme.editor.selectionBackground;
		},
		
		startRow() {
		},
		
		endRow() {
		},
		
		skipText(cols) {
			
		},
		
		draw() {
			context.fillRect(x, y, width, height);
		},
	};
}
