let getLineStartingRow = require("./getLineStartingRow");

module.exports = function(
	lines,
	lineIndex,
	scrollPosition,
) {
	let row = getLineStartingRow(lines, lineIndex);
	
	return row - scrollPosition.row;
}
