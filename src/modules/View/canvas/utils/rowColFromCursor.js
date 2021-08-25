let expandTabs = require("modules/utils/string/expandTabs");

module.exports = function(wrappedLines, cursor) {
	let {lineIndex, offset} = cursor;
	let row = 0;
	
	for (let i = 0; i < lineIndex; i++) {
		row += wrappedLines[i].height;
	}
	
	let wrappedLine = wrappedLines[lineIndex];
	
	let lineRowIndex = 0;
	let lineRow;
	let innerOffset = offset;
	
	for (let i = 0; i < wrappedLine.height; i++) {
		lineRow = wrappedLine.rows[i];
		
		/*
		if we're at the end of a line that ends in a soft wrap, go to the next row
		otherwise (if we're at the end of an actual line, whether wrapped or not)
		we can be at the end
		*/
		
		if (wrappedLine.height > 1 && i !== wrappedLine.height - 1) {
			if (innerOffset < lineRow.string.length) {
				break;
			}
		} else {
			if (innerOffset <= lineRow.string.length) {
				break;
			}
		}
		
		row++;
		lineRowIndex++;
		innerOffset -= lineRow.string.length;
	}
	
	let col = expandTabs(lineRow.string.substr(0, innerOffset)).length;
	
	if (lineRowIndex > 0) {
		col += wrappedLine.line.indentCols;
	}
	
	return [row, col];
}
