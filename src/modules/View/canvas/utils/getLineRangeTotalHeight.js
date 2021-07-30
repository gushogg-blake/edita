module.exports = function(wrappedLines, startLineIndex, endLineIndex) {
	let height = 0;
	
	for (let i = startLineIndex; i <= endLineIndex; i++) {
		height += wrappedLines[i].height;
	}
	
	return height;
}
