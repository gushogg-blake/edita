module.exports = function(layers, view) {
	let {
		fontFamily,
		fontSize,
		marginBackground,
		lineNumberColor,
	} = base.theme.editor;
	
	let {
		sizes: {height, marginWidth, topMargin, marginStyle},
		measurements: {colWidth, rowHeight},
		scrollPosition,
	} = view;
	
	let context = layers.margin;
	
	let rowOffset = -(scrollPosition.y % rowHeight);
	let y = rowHeight + topMargin + rowOffset; // rowHeight added as using textBaseline="bottom"
	
	return {
		init() {
			context.font = fontSize + "px " + fontFamily;
			
			context.fillStyle = marginBackground;
			context.fillRect(0, 0, marginWidth, height);
		},
		
		drawLineNumber(lineIndex) {
			let lineNumber = String(lineIndex + 1);
			let x = marginWidth - marginStyle.paddingRight - lineNumber.length * colWidth;
			
			context.fillStyle = lineNumberColor;
			context.fillText(lineNumber, x, y);
		},
		
		endRow() {
			y += rowHeight;
		},
	};
}
