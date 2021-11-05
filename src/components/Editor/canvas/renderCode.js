module.exports = function(layers, view) {
	let {
		font,
		marginBackground,
		lineNumberColor,
	} = platform.prefs;
	
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
		height,
		topMargin,
		marginWidth,
		marginOffset,
		marginStyle,
	} = sizes;
	
	let context = layers.code;
	
	context.font = font;
	context.fillStyle = "black";
	
	let leftEdge = marginOffset - scrollPosition.x;
	let rowOffset = -(scrollPosition.y % rowHeight);
	
	let x;
	let y = rowHeight + topMargin + rowOffset; // rowHeight added as using textBaseline="bottom"
	
	return {
		setColour(colour) {
			context.fillStyle = colour;
		},
		
		startRow(wrapIndent) {
			x = leftEdge + wrapIndent * colWidth;
		},
		
		endRow() {
			y += rowHeight;
		},
		
		drawTab(width) {
			x += width * colWidth;
		},
		
		drawText(string) {
			context.fillText(string, x, y);
			
			x += string.length * colWidth;
		},
	};
}
