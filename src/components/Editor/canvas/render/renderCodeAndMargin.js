let findFirstVisibleLine = require("../utils/findFirstVisibleLine");
let calculateMarginWidth = require("../utils/calculateMarginWidth");
let calculateMarginOffset = require("../utils/calculateMarginOffset");
let marginStyle = require("../marginStyle");
let topMargin = require("../topMargin");

module.exports = function(
	context,
	lines,
	scrollPosition,
	fileDetails,
	measurements,
) {
	let {
		font,
		tabWidth,
		marginBackground,
		lineNumberColor,
	} = app.prefs;
	
	context.font = font;
	context.fillStyle = "black";
	
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
	
	let {colors} = app.prefs.langs[lang.code] || {colors: {}}; //
	
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
	
	// find the previous colour hint, if any (otherwise e.g. multiline comments
	// won't be coloured as comments if the opener is not on screen)
	
	findPreviousColourHint: for (let i = firstLineIndex - 1; i >= 0; i--) {
		let line = lines[i];
		
		for (let [type, value] of [...line.render(line)].reverse()) {
			if (type === "colour") {
				let node = value;
				
				context.fillStyle = colors[lang.getHiliteClass(node)];
				
				break findPreviousColourHint;
			}
			
			if (type === "node") {
				break findPreviousColourHint;
			}
		}
	}
	
	let lineIndex = firstLineIndex;
	
	while (true) {
		let line = lines[lineIndex];
		
		// code
		
		for (let i = 0; i < line.height; i++) {
			let wrappedLine = line.height === 1 ? line : line.wrappedLines[i];
			
			if (i > 0) {
				x += line.indentCols * colWidth;
			}
			
			for (let [type, value] of line.render(wrappedLine)) {
				if (type === "colour") {
					let node = value;
					
					context.fillStyle = colors[lang.getHiliteClass(node)];
				}
				
				if (lineIndex === firstLineIndex && i < wrappedLineIndex) {
					continue;
				}
				
				if (type === "string") {
					let string = value;
					
					context.fillText(string, x, y);
					
					x += string.length * colWidth;
				} else if (type === "node") {
					let node = value;
					let str = node.text;
					
					context.fillStyle = colors[lang.getHiliteClass(node)];
					context.fillText(str, x, y);
					
					x += str.length * colWidth;
				} else if (type === "tab") {
					x += value * colWidth;
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
