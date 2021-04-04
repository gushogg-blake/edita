let rowColFromCursor = require("./rowColFromCursor");
let screenCoordsFromRowCol = require("./screenCoordsFromRowCol");

module.exports = function(
	lines,
	lineIndex,
	offset,
	scrollPosition,
	measurements,
) {
	let row = 0;
	
	for (let i = 0; i < lineIndex; i++) {
		row += lines[i].height;
	}
	
	let line = lines[lineIndex];
	
	let innerLine;
	let charsConsumed = 0;
	let isInWrappedLine = false;
	let innerLineOffset = offset;
	
	for (let i = 0; i < line.height; i++) {
		isInWrappedLine = i > 0;
		innerLine = isInWrappedLine ? line.wrappedLines[i] : line;
		
		if (innerLineOffset < innerLine.string.length) {
			break;
		}
		
		row++;
		innerLineOffset -= innerLine.string.length;
	}
	
	
	
	if (line.height > 1) {
		
	}
	
	return [0, 0];
}
	