let {paddingLeft, paddingRight, margin} = require("../marginStyle");

module.exports = function(wrappedLines, measurements) {
	return paddingLeft + String(wrappedLines.length).length * measurements.colWidth + paddingRight + margin;
}
