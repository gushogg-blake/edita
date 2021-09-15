module.exports = function(document, lineIndex, dir) {
	let {lines} = document;
	let space = 0;
	let line;
	
	while (line = lines[lineIndex]) {
		if (line.trimmed.length === 0) {
			space++;
		} else {
			break;
		}
		
		lineIndex += dir;
	}
	
	return space;
}
