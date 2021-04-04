module.exports = function(
	lines,
	row,
	col,
) {
	let lineIndex = 0;
	let r = 0;
	
	for (let i = 0; i < lines.length; i++) {
		if (r + lines[i].height > row) {
			break;
		}
		
		r += lines[i].height;
		lineIndex++;
	}
	
	let line = lines[lineIndex];
	
	let innerLineIndex = row - r;
	
	console.log(innerLineIndex);
	
	return [0, 0];
}
