let findFirstVisibleLine = require("../utils/findFirstVisibleLine");
let marginStyle = require("./marginStyle");
let calculateMarginWidth = require("./calculateMarginWidth");
let calculateMarginOffset = require("./calculateMarginOffset");
let topMargin = require("./topMargin");

module.exports = function(
	context,
	lines,
	scrollPosition,
	prefs,
	fileDetails,
	colors,
	measurements,
) {
	context.font = prefs.font;
	
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
		
		if (lang.stateColors[prevLine.endState.state]) {
			context.fillStyle = colors[lang.stateColors[prevLine.endState.state]];
		}
	}
	
	while (true) {
		let line = lines[lineIndex];
		
		// code
		
		for (let i = 0; i < line.height; i++) {
			if (lineIndex === firstLineIndex && i < wrappedLineIndex) {
				continue;
			}
			
			let commands = line.height === 1 ? line.commands : line.wrappedLines[i].commands;
			
			if (i > 0) {
				console.log("wrapped line");
				console.log(line.string);
				console.log(line.indentOffset);
				x += line.indentOffset * colWidth;
			}
			
			for (let command of commands) {
				let [type, value] = command;
				
				if (type === "string") {
					context.fillText(value, x, y);
					
					x += value.length * colWidth;
				} else if (type === "colour") {
					context.fillStyle = colors[value];
				} else if (type === "tab") {
					let width = value;
					
					context.fillText(" ".repeat(width), x, y);
					
					x += width * colWidth;
				}
			}
			
			rowsRendered++;
			x = leftEdge;
			y += rowHeight;
		}
		
		let {fillStyle} = context;
		
		// margin background
		// rendered after code so that it covers it if code is scrolled horizontally
		
		let marginHeight = line.height * rowHeight;
		
		context.fillStyle = prefs.marginBackground;
		context.fillRect(0, y - marginHeight - rowHeight, marginWidth, marginHeight);
		
		// line number
		
		let lineNumber = String(lineIndex + 1);
		
		context.fillStyle = prefs.lineNumberColor;
		
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
