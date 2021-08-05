let {paddingLeft, paddingRight, margin} = require("../marginStyle");

module.exports = function(wrappedLines, measurements) {
	return Math.round(paddingLeft + String(wrappedLines.length).length * measurements.colWidth + paddingRight + margin);
}
