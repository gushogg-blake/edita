module.exports = function(lines, lineIndex, indentLevel, dir) {
	let line;
	
	while (line = lines[lineIndex]) {
		if (line.indentLevel < indentLevel) {
			return null;
		}
		
		if (line.indentLevel === indentLevel && line.trimmed.length > 0) {
			return lineIndex;
		}
		
		lineIndex += dir;
	}
	
	return null;
}
