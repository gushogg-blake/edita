/*
accepts a list of tokens and renders them to the canvas

this will be passed only the tokens that are currently visible
*/

module.exports = function(
	c,
	prefs,
	document,
	measurements,
	margin,
	scrollPosition,
) {
	console.time("render");
	
	let {
		width,
		height,
	} = c.canvas;
	
	c.font = prefs.font;
	
	c.clearRect(0, 0, width, height);
	
	// TODO render current line (document.selection)
	// TODO render cursor (document.selection)
	// TODO render selection (document.selection)
	
	let {colors} = prefs.langs[document.lang];
	
	let {
		charWidth,
		lineHeight,
	} = measurements;
	
	let leftEdge = margin.widthPlusGap - scrollPosition.x;
	
	let x = leftEdge;
	let y = lineHeight; // not 0 -- we're using textBaseline="bottom"
	
	let linesRendered = 0;
	let maxLines = height / lineHeight;
	
	// render main text
	
	document.iterTokens(scrollPosition.tokenIndex, function(type, value, i) {
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
			x = leftEdge;
			y += lineHeight;
			linesRendered++;
		} else if (type === "W") {
			x = leftEdge;
			y += lineHeight;
			linesRendered++;
		}
		
		if (linesRendered >= maxLines) {
			return true;
		}
	});
	
	// render margin (line nos etc)
	
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
	
	document.iterTokens(scrollPosition.tokenIndex, function(type, value) {
		if (type === "L") {
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
