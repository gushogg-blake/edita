module.exports = function(lines, lineIndex) {
	let startingRow = 0;
	
	for (let i = 0; i < lines.length; i++) {
		let line = lines[i];
		
		if (i === lineIndex) {
			break;
		}
		
		startingRow += line.height;
	}
	
	return startingRow;
}
