let {
	findNextLineIndexAtIndentLevel,
	findPrevLineIndexAtIndentLevel,
} = require("../../../common/codeIntel/utils");

function fromLineIndex(lines, lineIndex, forHilite) {
	return [
		lineIndex,
		lineIndex,
	];
}

module.exports = fromLineIndex;
