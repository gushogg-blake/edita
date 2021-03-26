/*
Renders the current state to the canvas.  Includes:

- Underlays (current line highlight, selection, other highlights)
- The code
- Cursor (if cursorBlinkOn)
- Margin (line nos etc)
*/

module.exports = function(
	c,
	prefs,
	document,
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
	
	c.font = prefs.font;
	
	c.clearRect(0, 0, width, height);
	
	let {colors} = prefs.langs[document.lang];
	
	let {
		charWidth,
		lineHeight,
	} = measurements;
	
	let leftEdge = margin.widthPlusGap - scrollPosition.x;
	
	let x = leftEdge;
	let y = lineHeight; // not 0 -- we're using textBaseline="bottom"
	
	let renderLines = height / lineHeight;
	let {lineIndex} = scrollPosition;
	let maxIndex = lineIndex + renderLines - 1;
	
	// Code
	
	for (let i = lineIndex; i <= maxIndex; i++) {
		let {commands} = document.lines[lineIndex];
		
		for (let command of commands) {
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
			} else if (type === "N") {
				
				linesRendered++;
			} else if (type === "W") {
				x = leftEdge;
				y += lineHeight;
				linesRendered++;
			}
		}
		
		x = leftEdge;
		y += lineHeight;
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
	
	// TODO render cursor (document.selection)
	
	console.timeEnd("render");
}
