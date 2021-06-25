module.exports = function(lines, lineIndex) {
	let prev = 0;
	let next = 0;
	let prevLineIndex = lineIndex - 1;
	let nextLineIndex = lineIndex;
	
	while (prevLineIndex >= 0) {
		if (lines[prevLineIndex].trimmed.length > 0) {
			prev = lines[prevLineIndex].indentLevel;
			
			break;
		}
		
		prevLineIndex--;
	}
	
	while (nextLineIndex < lines.length) {
		if (lines[nextLineIndex].trimmed.length > 0) {
			next = lines[nextLineIndex].indentLevel;
			
			break;
		}
		
		nextLineIndex++;
	}
	
	return Math.max(next, prev);
}
