module.exports = function(layers, view, isPeeking) {
	let {
		sizes: {width, topMargin, marginWidth, marginOffset},
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
			context.fillStyle = base.theme.editor.astSelectionBackground;
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
		},
		
		draw(onlyIfPeeking) { // AstSelection.equals(hilite, selection)
			if (onlyIfPeeking && !isPeeking) {
				return;
			}
			
			if (height === 0) {
				context.fillRect(0, y, width, 2);
			} else {
				context.fillRect(0, y, width, height);
			}
		},
	};
}
