module.exports = function(wrappedLines) {
	let rows = 0;
	
	for (let wrappedLine of wrappedLines) {
		rows += wrappedLine.height;
	}
	
	return rows;
}
