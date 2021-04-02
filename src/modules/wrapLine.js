let minNonWhitespaceCols = 16;

let wordRe = /\w/;

module.exports = function(line, measurements, screenWidth) {
	let {colWidth} = measurements;
	let screenCols = screenWidth / colWidth; // might have decimal places, doesn't matter for calculation
	
	line.height = 1;
	
	delete line.wrappedLines;
	delete line.wrapIndentCols;
	
	if (line.width <= screenCols) {
		return;
	}
	
	/*
	calculate indent width to 1) check whether initial whitespace should
	be treated as an indent or just a long string of spaces (depending on
	how much space there would be left for non-whitespace characters), and
	2) indent wrapped lines to the same level as the main line
	*/
	
	let indentCols = 0;
	
	cmds: for (let command of line.commands) {
		let [type, value] = [command[0], command.substr(1)];
		
		if (type === "S") {
			for (let ch of value) {
				if (ch === " ") {
					indentCols++;
				} else {
					break cmds;
				}
			}
		} else if (type === "T") {
			indentCols += Number(value);
		}
	}
	
	let isIndented = screenCols - indentCols >= minNonWhitespaceCols;
	let availableCols = isIndented ? screenCols - indentCols : screenCols;
	
	if (isIndented) {
		line.wrapIndentCols = indentCols;
	}
	
	/*
	
	*/
	
	line.wrappedLines = [];
	
	
	
	while (true) {
		
	}
}
