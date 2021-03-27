/*
Renders the current state to the canvas.  Includes:

- Underlays (current line highlight, selection, other highlights)
- The code
- The cursor
- Margin (line nos, folding, etc)
*/

/*
scroll position

scrollPosition has row and col - visual lines/cols

render receives all lines

scan all lines to calculate where to start rendering, taking account of wrapping
(lines are effectively variable height - one line != one row)

(scanning is fast, 0.7ms to search half way down a 30k line file)
*/

module.exports = function(
	lines,
	c,
	font,
	colors,
	indentWidth,
	measurements,
	margin,
	scrollPosition,
	selection,
	cursorBlinkOn,
) {
	console.time("render");
	
	let {
		width,
		height,
	} = c.canvas;
	
	c.font = font;
	
	c.clearRect(0, 0, width, height);
	
	let {
		colWidth,
		rowHeight,
	} = measurements;
	
	let leftEdge = margin.widthPlusGap - scrollPosition.col * colWidth;
	
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
				c.fillText(value, x, y);
				
				x += value.length * charWidth;
			} else if (type === "C") {
				c.fillStyle = colors[value];
			} else if (type === "T") {
				let width = Number(value);
				
				c.fillText(" ".repeat(width), x, y);
				
				x += width * charWidth;
			}
		}
		
		if (screenFull) {
			break;
		}
		
		//x = leftEdge;
		//y += lineHeight;
	}
	
	// Margin (line nos etc)
	
	let {
		overallWidth,
		paddingLeft,
		paddingRight,
	} = margin;
	
	c.fillStyle = "#f0f0f0";
	c.fillRect(0, 0, overallWidth, height);
	
	x = leftEdge;
	y = lineHeight;
	linesRendered = 0;
	
	c.fillStyle = prefs.lineNumberColor;
	
	for (let i = lineIndex; i <= maxIndex; i++) {
		let {lineNumber} = document.lines[lineIndex];
		
			c.fillText(
				value,
				overallWidth - paddingRight - value.length * charWidth,
				y,
			);
		} else if (type === "N" || type === "W") {
			y += lineHeight;
			linesRendered++;
		}
		
		if (linesRendered >= maxLines) {
			return true;
		}
	});
	
	console.timeEnd("render");
}
