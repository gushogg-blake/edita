module.exports = function(lines, startLineIndex, endLineIndex) {
	let height = 0;
	
	for (let i = startLineIndex; i <= endLineIndex; i++) {
		height += lines[i].height;
	}
	
	return height;
}
