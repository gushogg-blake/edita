module.exports = function(wrappedLines, row, col, beforeTab=false) {
	let lineIndex = 0;
	let offset = 0;
	let r = 0;
	
	for (let i = 0; i < wrappedLines.length - 1; i++) {
		if (r + wrappedLines[i].height > row) {
			break;
		}
		
		r += wrappedLines[i].height;
		lineIndex++;
	}
	
	lineIndex = Math.min(lineIndex, wrappedLines.length - 1);
	
	let wrappedLine = wrappedLines[lineIndex];
	let lineRowIndex = row - r;
	
	if (lineRowIndex > wrappedLine.height - 1) { // mouse is below text
		return {
			lineIndex,
			offset: wrappedLine.line.string.length,
		};
	}
	
	let i = 0;
	
	while (i < lineRowIndex) {
		offset += wrappedLine.rows[i].string.length;
		i++;
	}
	
	if (lineRowIndex > 0) {
		col -= wrappedLine.line.indentCols;
		
		if (col < 0) {
			col = 0;
		}
	}
	
	// consume chars until c is col
	
	let c = 0;
	
	let {variableWidthParts} = wrappedLine.rows[lineRowIndex];
	
	for (let [type, value] of variableWidthParts) {
		if (c === col) {
			break;
		}
		
		if (type === "tab") {
			let width = value;
			
			if (c + width > col) {
				// the col is within the tab
				// if more than half way go to after the tab
				// otherwise stay before it
				
				if (!beforeTab && col - c > width / 2) {
					offset++;
				}
				
				break;
			}
			
			c += width;
			offset++;
		} else if (type === "string") {
			if (c + value.length > col) {
				// col is within the current string
				// add the remaining cols to the offset
				
				offset += col - c;
				
				break;
			}
			
			c += value.length;
			offset += value.length;
		}
	}
	
	return {lineIndex, offset};
}
