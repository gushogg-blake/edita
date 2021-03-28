let marginStyle = require("./marginStyle");

module.exports = function(
	context,
	lines,
	selection,
	scrollPosition,
	font,
	colors,
	measurements,
) {
	context.font = font;
	
	let {
		colWidth,
		rowHeight,
	} = measurements;
	
	let leftEdge = marginStyle.widthPlusGap - scrollPosition.col * colWidth;
	
	let x = leftEdge;
	let y = rowHeight; // not 0 -- we're using textBaseline="bottom"
	
	let renderRows = height / lineHeight;
	let renderedRows = 0;
	
	// TODO find the first line that's onscreen (if only partially)
	
	
	// Code & margin
	
	while (true) {
		let line = lines[i];
		
		
		for (let command of line.commands) {
			let [type, value] = [command.charAt(0), command.substr(1)];
			
			if (type === "S" || type === "B") {
				context.fillText(value, x, y);
				
				x += value.length * charWidth;
			} else if (type === "C") {
				context.fillStyle = colors[value];
			} else if (type === "T") {
				let width = Number(value);
				
				context.fillText(" ".repeat(width), x, y);
				
				x += width * charWidth;
			}
		}
		
		if (screenFull) {
			break;
		}
		
		//x = leftEdge;
		//y += lineHeight;
	}
	
	// Margin (line nos, folding)
	
	let {
		margin,
		paddingLeft,
		paddingRight,
	} = marginStyle;
	
	context.fillStyle = "#f0f0f0";
	context.fillRect(0, 0, overallWidth, height);
	
	x = leftEdge;
	y = lineHeight;
	linesRendered = 0;
	
	context.fillStyle = prefs.lineNumberColor;
	
	for (let i = lineIndex; i <= maxIndex; i++) {
		let lineNumber = lineIndex + 1;
		
		context.fillText(
			lineNumber,
			overallWidth - paddingRight - value.length * charWidth,
			y,
		);
		
		y += lineHeight; // TODO rowHeight * line....
	});
}
