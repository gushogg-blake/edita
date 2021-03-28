module.exports = function(lines, screenWidth, measurements) {
	let {colWidth} = measurements;
	
	for (let line of lines) {
		if (line.width * colWidth > screenWidth) {
			// TODO wrap
		} else {
			line.height = 1;
			line.wrappedLines = undefined;
		}
	}
}
