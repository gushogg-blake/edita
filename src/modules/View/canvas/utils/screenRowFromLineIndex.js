let getLineStartingRow = require("./getLineStartingRow");

module.exports = function(
	wrappedLines,
	lineIndex,
	scrollPosition,
) {
	let row = getLineStartingRow(wrappedLines, lineIndex);
	
	return row - scrollPosition.row;
}
