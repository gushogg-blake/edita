module.exports = function(
	lines,
	lineIndex,
	offset,
) {
	let line = lines[lineIndex];
	let innerLineIndex = 0;
	let innerLine;
	let innerLineOffset = offset;
	
	for (let i = 0; i < line.height; i++) {
		innerLine = line.height > 1 ? line.wrappedLines[i] : line;
		
		if (line.height > 1 && i !== line.height - 1) {
			if (innerLineOffset < innerLine.string.length) {
				break;
			}
		} else {
			if (innerLineOffset <= innerLine.string.length) {
				break;
			}
		}
		
		innerLineIndex++;
		innerLineOffset -= innerLine.string.length;
	}
	
	return [innerLineIndex, innerLineOffset];
}
