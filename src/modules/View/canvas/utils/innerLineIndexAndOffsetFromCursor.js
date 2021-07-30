module.exports = function(
	wrappedLines,
	lineIndex,
	offset,
) {
	let wrappedLine = wrappedLines[lineIndex];
	let innerLineIndex = 0;
	let lineRow;
	let innerLineOffset = offset;
	
	for (let i = 0; i < wrappedLine.height; i++) {
		lineRow = wrappedLine.rows[i];
		
		if (wrappedLine.height > 1 && i !== wrappedLine.height - 1) {
			if (innerLineOffset < lineRow.string.length) {
				break;
			}
		} else {
			if (innerLineOffset <= lineRow.string.length) {
				break;
			}
		}
		
		innerLineIndex++;
		innerLineOffset -= lineRow.string.length;
	}
	
	return [innerLineIndex, innerLineOffset];
}
