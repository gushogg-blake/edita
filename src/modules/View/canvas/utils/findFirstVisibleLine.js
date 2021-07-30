module.exports = function(wrappedLines, scrollPosition) {
	let row = 0;
	
	for (let i = 0; i < wrappedLines.length; i++) {
		let wrappedLine = wrappedLines[i];
		
		if (row + wrappedLine.height > scrollPosition.row) {
			return {
				wrappedLine,
				index: i,
				lineRowIndex: scrollPosition.row - row,
			};
		}
		
		row += wrappedLine.height;
	}
	
	return null;
}
