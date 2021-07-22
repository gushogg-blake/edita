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
	measurements,
) {
	let {
		font,
		tabWidth,
		marginBackground,
		lineNumberColor,
	} = app.prefs;
	
	let {colors} = app.prefs.langs[fileDetails.lang.code];
	
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
	
	// TODO color
	//if (lineIndex > 0) {
	//	let prevLine = lines[lineIndex - 1];
	//	
	//	if (lang.parse.stateColors[prevLine.endState.state]) {
	//		context.fillStyle = colors[lang.parse.stateColors[prevLine.endState.state]];
	//	}
	//}
	
	while (true) {
		let line = lines[lineIndex];
		
		// code
		
		for (let i = 0; i < line.height; i++) {
			if (lineIndex === firstLineIndex && i < wrappedLineIndex) {
				continue;
			}
			
			let wrappedLine = line.height === 1 ? line : line.wrappedLines[i];
			let startOffset = i > 0 ? wrappedLine.startOffset : 0;
			let offset = 0;
			
			if (i > 0) {
				x += line.indentCols * colWidth;
			}
			
			for (let [type, value] of wrappedLine.variableWidthParts) {
				if (type === "string") {
					let string = value;
					let j = 0;
					
					while (j < string.length) {
						let node = line.nodes.get(startOffset + offset);
						
						if (node) {
							let str = node.text;
							
							context.fillStyle = colors[lang.getHiliteClass(node)];
							
							if (lang.isChildlessMultiline(node)) {
								context.fillText(string[j], x, y);
								
								offset++;
								j++;
								x += colWidth;
							} else {
								context.fillText(str, x, y);
								
								offset += str.length;
								j += str.length;
								x += str.length * colWidth;
							}
						} else {
							context.fillText(string[j], x, y);
							
							offset++;
							j++;
							x += colWidth;
						}
					}
				} else if (type === "tab") {
					x += value * colWidth;
					offset++;
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
