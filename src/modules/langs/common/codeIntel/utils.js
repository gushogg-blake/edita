let api = {
	findNextLineIndexAtIndentLevel(lines, lineIndex, indentLevel) {
		for (let i = lineIndex + 1; i < lines.length; i++) {
			if (lines[i].indentLevel === indentLevel) {
				return i;
			}
		}
		
		return null;
	},
	
	findPrevLineIndexAtIndentLevel(lines, lineIndex, indentLevel) {
		for (let i = lineIndex - 1; i >= 0; i--) {
			if (lines[i].indentLevel === indentLevel) {
				return i;
			}
		}
		
		return null;
	},
};

module.exports = api;
