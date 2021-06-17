let insertRowIndexFromScreenY = require("./insertRowIndexFromScreenY");
let insertLineIndexFromInsertRow = require("./insertLineIndexFromInsertRow");

module.exports = function(
	lines,
	y,
	scrollPosition,
	measurements,
) {
	let rowIndex = insertRowIndexFromScreenY(y, scrollPosition, measurements));
}
