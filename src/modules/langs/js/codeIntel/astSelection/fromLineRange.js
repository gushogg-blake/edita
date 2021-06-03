let fromLineIndex = require("./fromLineIndex");

function fromLineRange(lines, startLineIndex, endLineIndex) {
	if (startLineIndex === endLineIndex) {
		return fromLineIndex(lines, startLineIndex, endLineIndex, false);
	}
	
	let startLine = lines[startLineIndex];
	let endLine = lines[endLineIndex];
	
	while (startLine.trimmed.length === 0 && startLineIndex < endLineIndex - 1) {
		startLineIndex++;
		startLine = lines[startLineIndex];
	}
	
	while (endLine.trimmed.length === 0 && endLineIndex > startLineIndex) {
		endLineIndex--;
		endLine = lines[endLineIndex];
	}
	
	return [
		startLineIndex,
		endLineIndex + 1,
	];
}

module.exports = fromLineRange;
