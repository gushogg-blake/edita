let getLineStartingRow = require("../utils/getLineStartingRow");
let screenCoordsFromRowCol = require("../utils/screenCoordsFromRowCol");
let getLineRangeTotalHeight = require("../utils/getLineRangeTotalHeight");
let AstSelection = require("../utils/AstSelection");

module.exports = function(
	context,
	lines,
	astHilite,
	astSelection,
	isPeeking,
	scrollPosition,
	prefs,
	fileDetails,
	measurements,
) {
	if (!astHilite) {
		return;
	}
	
	if (!isPeeking && AstSelection.equals(astHilite, astSelection)) {
		return;
	}
	
	context.fillStyle = prefs.astHiliteBackground;
	
	let {colWidth, rowHeight} = measurements;
	let [startLineIndex, endLineIndex] = astHilite;
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
