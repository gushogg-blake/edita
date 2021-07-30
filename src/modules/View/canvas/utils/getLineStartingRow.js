module.exports = function(wrappedLines, lineIndex) {
	let startingRow = 0;
	
	for (let i = 0; i < wrappedLines.length; i++) {
		if (i === lineIndex) {
			break;
		}
		
		startingRow += wrappedLines[i].height;
	}
	
	return startingRow;
}
