module.exports = function(layers, view, offsets) {
	let {
		sizes: {width, marginWidth},
		measurements: {colWidth, rowHeight},
	} = view;
	
	let {
		fontFamily,
		fontSize,
		defaultColor,
	} = base.theme.editor;
	
	let context = layers.code;
	
	let x;
	let y = offsets.rowOffset + rowHeight; // rowHeight added as using textBaseline="bottom"
	
	return {
		init() {
			context.font = fontSize + " " + fontFamily;
			context.fillStyle = defaultColor;
		},
		
		setColor(color) {
			context.fillStyle = color;
		},
		
		startRow(wrapIndentCols) {
			x = offsets.leftEdge + wrapIndentCols * colWidth;
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
