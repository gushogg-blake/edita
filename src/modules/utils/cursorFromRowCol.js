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
	
	let line = lines[lineIndex];
	
	let innerLineIndex = row - r;
	
	let i = 0;
	
	while (i < innerLineIndex) {
		offset += line.wrappedLines[i].string.length;
		i++;
	}
	
	// consume chars until c is col
	
	let c = 0;
	
	let {commands} = line.height > 1 ? line.wrappedLines[innerLineIndex] : line;
	
	for (let command of commands) {
		if (c === col) {
			break;
		}
		
		let [type, value] = [command[0], command.substr(1)];
		
		if (type === "T") {
			let width = Number(value);
			
			if (c + width > col) {
				// col is within tab
				
				break;
			}
			
			c += width;
			offset++;
		} else if (type === "S" || type === "B") {
			if (c + value.length > col) {
				// col is within string
				
				break;
			}
			
			c += value.length;
			offset += value.length;
		}
	}
	
	return [lineIndex, offset];
}
