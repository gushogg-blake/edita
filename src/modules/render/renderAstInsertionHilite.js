let getLineStartingRow = require("../utils/getLineStartingRow");
let screenCoordsFromRowCol = require("../utils/screenCoordsFromRowCol");
let getLineRangeTotalHeight = require("../utils/getLineRangeTotalHeight");
let AstSelection = require("../utils/AstSelection");

module.exports = function(
	context,
	lines,
	hilite,
	selection,
	isPeeking,
	scrollPosition,
	prefs,
	fileDetails,
	measurements,
) {
	if (!hilite) {
		return;
	}
	
	context.fillStyle = prefs.astInsertionHiliteBackground;
	
	let {colWidth, rowHeight} = measurements;
	let [startLineIndex, endLineIndex] = hilite;
	
	if (startLineIndex === lines.length) {
		let startRow = getLineStartingRow(lines, startLineIndex - 1) + 1;
		
		let [x, y] = screenCoordsFromRowCol(
			lines,
			startRow,
			0,
			scrollPosition,
			measurements,
		);
		
		context.fillRect(x, y, context.canvas.width, 2);
		
		return;
	}
	
	let startLine = lines[startLineIndex];
	let startRow = getLineStartingRow(lines, startLineIndex);
	let height = (getLineRangeTotalHeight(lines, startLineIndex, endLineIndex - 1)) * rowHeight;
	
	let [x, y] = screenCoordsFromRowCol(
		lines,
		startRow,
		startLine.indentLevel * fileDetails.indentation.colsPerIndent,
		scrollPosition,
		measurements,
	);
	
	if (height === 0) {
		context.fillRect(x, y, context.canvas.width, 2);
	} else {
		context.fillRect(x, y, context.canvas.width, height);
	}
}
