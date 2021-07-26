let fromLineIndex = require("./fromLineIndex");

module.exports = function(lines, lineIndex) {
	return fromLineIndex(lines, lineIndex, false);
}
