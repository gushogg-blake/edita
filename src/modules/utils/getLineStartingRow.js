module.exports = function(lines, lineIndex) {
	let startingRow = 0;
	
	for (let i = 0; i < lines.length; i++) {
		if (i === lineIndex) {
			break;
		}
		
		startingRow += lines[i].height;
	}
	
	return startingRow;
}
