module.exports = function(layers, view) {
	let {
		fontFamily,
		fontSize,
		marginBackground,
		lineNumberColor,
	} = base.theme;
	
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
		marginWidth,
		topMargin,
		marginStyle,
	} = sizes;
	
	let context = layers.margin;
	
	context.font = fontSize + "px " + fontFamily;
	
	context.fillStyle = marginBackground;
	context.fillRect(0, 0, marginWidth, height);
	
	let rowOffset = -(scrollPosition.y % rowHeight);
	
	let y = rowHeight + topMargin + rowOffset; // rowHeight added as using textBaseline="bottom"
	
	return {
		endRow() {
			y += rowHeight;
		},
		
		drawLineNumber(lineIndex) {
			let lineNumber = String(lineIndex + 1);
			let x = marginWidth - marginStyle.paddingRight - lineNumber.length * colWidth;
			
			context.fillStyle = lineNumberColor;
			context.fillText(lineNumber, x, y);
		},
	};
}
