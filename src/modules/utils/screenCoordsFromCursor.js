module.exports = function(
	lines,
	lineIndex,
	offset,
	scrollPosition,
	measurements,
) {
	/*
	calculate screen offsets from real offsets
	*/
	
	let row = 0;
	
	for (let i = 0; i < lineIndex; i++) {
		row += lines[i].height;
	}
	
	let line = lines[lineIndex];
	
	if (line.height > 1) {
		// TODO find pos within wrap
		// inner lines will be indented - add line.indent to value
	}
}
	