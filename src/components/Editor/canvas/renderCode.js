module.exports = function(layers, view) {
	let {
		fontFamily,
		fontSize,
		marginBackground,
		lineNumberColor,
		defaultColor,
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
	
	let context = layers.code;
	
	context.font = fontSize + "px " + fontFamily;
	context.fillStyle = defaultColor;
	
	let leftEdge = marginOffset - scrollPosition.x;
	let rowOffset = -(scrollPosition.y % rowHeight);
	
	let x;
	let y = rowHeight + topMargin + rowOffset; // rowHeight added as using textBaseline="bottom"
	
	return {
		setColor(color) {
			context.fillStyle = color;
		},
		
		startRow(wrapIndentCols) {
			x = leftEdge + wrapIndentCols * colWidth;
		},
		
		endRow() {
			y += rowHeight;
		},
		
		drawTab(width) {
			x += width * colWidth;
		},
		
		drawText(string) {
			let offToLeft = Math.max(0, marginWidth - x);
			let charsOffToLeft = Math.min(string.length, Math.floor(offToLeft / colWidth));
			let maxLength = Math.ceil(width / colWidth);
			let trimmed = string.substr(charsOffToLeft);
			
			x += charsOffToLeft * colWidth;
			
			context.fillText(trimmed.substr(0, maxLength), x, y);
			
			x += trimmed.length * colWidth;
		},
		
		skipText(string) {
			x += string.length * colWidth;
		},
	};
}
