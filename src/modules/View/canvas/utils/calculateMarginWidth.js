let {paddingLeft, paddingRight} = require("../marginStyle");

module.exports = function(wrappedLines, measurements) {
	return paddingLeft + String(wrappedLines.length).length * measurements.colWidth + paddingRight;
}
