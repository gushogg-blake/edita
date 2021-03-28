let marginStyle = require("./marginStyle");
let findFirstVisibleLine = require("../utils/findFirstVisibleLine");

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
	
	let {
		width,
		height,
	} = context.canvas;
	
	let rowsToRender = height / lineHeight;
	let rowsRendered = 0;
	
	let leftEdge = marginPlusGap - scrollPosition.col * colWidth;
	
	// Code & margin
	
	let x = 0;
	let y = rowHeight; // not 0 -- we're using textBaseline="bottom"
	
	let {
		lineIndex,
		wrappedLineIndex,
	} = findFirstVisibleLine(lines, scrollPosition);
	
	while (true) {
		let line = lines[lineIndex];
		
		// code
		
		for (let i = 0; i < line.height; i++) {
			let commands = line.height === 1 ? line.commands : line.wrappedLines[i].commands;
			
			for (let command of line.commands) {
				let [type, value] = [command.charAt(0), command.substr(1)];
				
				if (type === "S") {
					context.fillText(value, x, y);
					
					x += value.length * charWidth;
				} else if (type === "B") {
					context.fillStyle = colors.symbol;
					context.fillText(value, x, y);
					
					x += charWidth;
				} else if (type === "C") {
					context.fillStyle = colors[value];
				} else if (type === "T") {
					let width = Number(value);
					
					context.fillText(" ".repeat(width), x, y);
					
					x += width * charWidth;
				}
			}
			
			rowsRendered++;
			x = leftEdge;
			y += rowHeight;
		}
		
		// margin background
		// rendered after code so that it covers it if code is scrolled horizontally
		
		let marginHeight = line.height * rowHeight
		
		context.fillStyle = "#f0f0f0";
		context.fillRect(0, y - marginHeight, overallWidth, marginHeight);
		
		// line number
		
		let lineNumber = String(lineIndex + 1);
		
		context.fillText(
			lineNumber,
			marginWidth - paddingRight - lineNumber.length * colWidth,
			y - marginHeight + rowHeight,
		);
		
		// TODO folding
		
		if (rowsRendered >= rowsToRender) {
			break;
		}
		
		lineIndex++;
		
		if (lineIndex === lines.length) {
			break;
		}
	}
	
	// Margin (line nos, folding)
	
	let {
		margin,
		paddingLeft,
		paddingRight,
	} = marginStyle;
	
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
