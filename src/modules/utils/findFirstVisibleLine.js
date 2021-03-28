module.exports = function(lines, scrollPosition) {
	let row = 0;
	
	for (let i = 0; i < lines.length; i++) {
		let line = lines[i];
		
		if (row + line.height > scrollPosition.row) {
			return {
				line,
				lineIndex: i,
				wrappedLineIndex: scrollPosition.row - row,
			};
		}
		
		row += line.height;
	}
	
	return null;
}
