module.exports = function(document, lineIndex, indentLevel, dir) {
	let {lines} = document;
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
