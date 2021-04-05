let sortSelection = require("../utils/sortSelection");
let screenCoordsFromCursor = require("../utils/screenCoordsFromCursor");
let rowColFromCursor = require("../utils/rowColFromCursor");
let screenCoordsFromRowCol = require("../utils/screenCoordsFromRowCol");

module.exports = function(
	context,
	lines,
	selection,
	scrollPosition,
	colors,
	measurements,
) {
	let {start, end} = sortSelection(selection);
	let [startLineIndex, startOffset] = start;
	let [endLineIndex, endOffset] = end;
	
	for (let i = startLineIndex; i <= endLineIndex; i++) {
		let line = lines[i];
		
		for (let j = 0; j < line.height; j++) {
			let width = line.height > 1 ? line.wrappedLines[j].width : line.width;
			if (i === startLineIndex && j === 0) {
				
			} else if (i === endLineIndex) {
				
			} else {
				
			}
		}
		
	}
}
