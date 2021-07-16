let findFirstVisibleLine = require("../utils/findFirstVisibleLine");
let marginStyle = require("./marginStyle");
let calculateMarginWidth = require("./calculateMarginWidth");
let calculateMarginOffset = require("./calculateMarginOffset");
let topMargin = require("./topMargin");

module.exports = function(
	context,
	lines,
	scrollPosition,
	fileDetails,
	colors,
	measurements,
) {
	let {
		font,
		tabWidth,
		marginBackground,
		lineNumberColor,
	} = app.prefs;
	
	context.font = font;
	
	let {
		colWidth,
		rowHeight,
	} = measurements;
	
	let {
		width,
		height,
	} = context.canvas;
	
	let {
		lang,
	} = fileDetails;
	
	let rowsToRender = height / rowHeight;
	let rowsRendered = 0;
	
	let marginWidth = calculateMarginWidth(lines, measurements);
	let marginOffset = calculateMarginOffset(lines, measurements);
	let leftEdge = marginOffset - scrollPosition.x;
	
	let x = leftEdge;
	let y = rowHeight + topMargin; // not 0 -- we're using textBaseline="bottom"
	
	let {
		lineIndex: firstLineIndex,
		wrappedLineIndex,
	} = findFirstVisibleLine(lines, scrollPosition);
	
	let lineIndex = firstLineIndex;
	
	if (lineIndex > 0) {
		let prevLine = lines[lineIndex - 1];
		
		if (lang.parse.stateColors[prevLine.endState.state]) {
			context.fillStyle = colors[lang.parse.stateColors[prevLine.endState.state]];
		}
	}
	
	while (true) {
		let line = lines[lineIndex];
		
		// code
		
		console.log("??");
		for (let i = 0; i < line.height; i++) {
			if (lineIndex === firstLineIndex && i < wrappedLineIndex) {
				continue;
			}
			
			let wrappedLine = line.height === 1 ? line : line.wrappedLines[i];
			let col = 0;
			let offset = 0;
			
			if (i > 0) {
				x += line.indentOffset * colWidth;
			}
			
			for (let string of wrappedLine.splitByTabs) {
				for (let j = 0; j < string.length; j++) {
					
					// TODO color
					context.fillStyle = "black";
					context.fillText(string[j], x, y);
					
					x += colWidth;
				}
				
				offset += string.length + 1;
				
				x += (tabWidth - string.length % tabWidth) * colWidth;
			}
			
			rowsRendered++;
			x = leftEdge;
			y += rowHeight;
		}
		
		let {fillStyle} = context;
		
		// margin background
		// rendered after code so that it covers it if code is scrolled horizontally
		
		let marginHeight = line.height * rowHeight;
		
		context.fillStyle = marginBackground;
		context.fillRect(0, y - marginHeight - rowHeight, marginWidth, marginHeight);
		
		// line number
		
		let lineNumber = String(lineIndex + 1);
		
		context.fillStyle = lineNumberColor;
		
		context.fillText(
			lineNumber,
			marginWidth - marginStyle.paddingRight - lineNumber.length * colWidth,
			y - marginHeight,
		);
		
		context.fillStyle = fillStyle;
		
		// TODO folding
		
		if (rowsRendered >= rowsToRender) {
			break;
		}
		
		lineIndex++;
		
		if (lineIndex === lines.length) {
			break;
		}
	}
}
