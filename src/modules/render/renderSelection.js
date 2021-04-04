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
	
	for (let i = startLineIndex; i < endLineIndex; i++) {
		let line = lines[i];
		
		
	}
}
