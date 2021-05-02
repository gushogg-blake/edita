module.exports = function(
	lines,
	row,
	col,
) {
	let lineIndex = 0;
	let offset = 0;
	let r = 0;
	
	for (let i = 0; i < lines.length; i++) {
		if (r + lines[i].height > row) {
			break;
		}
		
		r += lines[i].height;
		lineIndex++;
	}
	
	lineIndex = Math.min(lineIndex, lines.length - 1);
	
	let line = lines[lineIndex];
	
	let innerLineIndex = row - r;
	
	innerLineIndex = Math.min(innerLineIndex, line.height - 1);
	
	let i = 0;
	
	while (i < innerLineIndex) {
		offset += line.wrappedLines[i].string.length;
		i++;
	}
	
	if (innerLineIndex > 0) {
		col -= line.wrapIndentCols;
		
		if (col < 0) {
			col = 0;
		}
	}
	
	// consume chars until c is col
	
	let c = 0;
	
	let {commands} = line.height > 1 ? line.wrappedLines[innerLineIndex] : line;
	
	for (let command of commands) {
		if (c === col) {
			break;
		}
		
		let [type, value] = command;
		
		if (type === "tab") {
			let width = value;
			
			if (c + width > col) {
				// the col is within the tab
				// if more than half way go to after the tab
				// otherwise stay before it
				
				if (col - c > width / 2) {
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
	
	return [lineIndex, offset];
}
