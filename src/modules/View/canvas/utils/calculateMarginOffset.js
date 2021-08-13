let {paddingLeft, paddingRight, margin} = require("../marginStyle");

module.exports = function(lines, measurements) {
	return Math.round(paddingLeft + String(lines.length).length * measurements.colWidth + paddingRight + margin);
}
