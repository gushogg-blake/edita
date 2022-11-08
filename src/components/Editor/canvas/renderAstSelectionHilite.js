module.exports = function(layers, view, isPeeking) {
	let {
		astSelectionHiliteBackground,
	} = base.theme.editor;
	
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
		width,
		topMargin,
		marginWidth,
		marginOffset,
	} = sizes;
	
	if (!hilite) {
		return;
	}
	
	let context = layers.hilites;
	
	context.fillStyle = astSelectionHiliteBackground;
	
	//let leftEdge = marginOffset - scrollPosition.x;
	let rowOffset = -(scrollPosition.y % rowHeight);
	
	//let x;
	let y = topMargin + rowOffset;
	
	let startY;
	let endY;
	
	return {
		setStartLine(line) {
			//x = Math.max(0, leftEdge + line.indentCols * colWidth);
			startY = y;
		},
		
		setEndLine
		
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
