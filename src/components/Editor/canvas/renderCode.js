module.exports = function(layers, view) {
	let {
		fontFamily,
		fontSize,
		defaultColor,
	} = base.theme.editor;
	
	let {
		sizes: {width, topMargin, marginWidth, marginOffset},
		measurements: {colWidth, rowHeight},
		scrollPosition,
	} = view;
	
	let context = layers.code;
	
	let leftEdge = marginOffset - scrollPosition.x;
	let rowOffset = -(scrollPosition.y % rowHeight);
	
	let x;
	let y = rowHeight + topMargin + rowOffset; // rowHeight added as using textBaseline="bottom"
	
	return {
		init() {
			context.font = fontSize + "px " + fontFamily;
			context.fillStyle = defaultColor;
		},
		
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
