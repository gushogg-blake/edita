module.exports = function(
	lines,
	lineIndex,
	offset,
) {
	let row = 0;
	
	for (let i = 0; i < lineIndex; i++) {
		row += lines[i].height;
	}
	
	let line = lines[lineIndex];
	
	let innerLineIndex = 0;
	let innerLine;
	let innerLineOffset = offset;
	
	for (let i = 0; i < line.height; i++) {
		innerLine = line.height > 1 ? line.wrappedLines[i] : line;
		
		/*
		if we're at the end of a line that ends in a soft wrap, go to the next row
		otherwise (if we're at the end of an actual line, whether wrapped or not)
		we can be at the end
		*/
		
		if (line.height > 1 && i !== line.height - 1) {
			if (innerLineOffset < innerLine.string.length) {
				break;
			}
		} else {
			if (innerLineOffset <= innerLine.string.length) {
				break;
			}
		}
		
		row++;
		innerLineIndex++;
		innerLineOffset -= innerLine.string.length;
	}
	
	let col = 0;
	let charsConsumed = 0;
	
	for (let command of innerLine.commands) {
		if (charsConsumed === innerLineOffset) {
			break;
		}
		
		let [type, value] = command;
		
		if (type === "tab") {
			col += value;
			charsConsumed++;
		} else if (type === "string") {
			let newCharsConsumed = Math.min(charsConsumed + value.length, innerLineOffset);
			let consumed = newCharsConsumed - charsConsumed;
			
			charsConsumed = newCharsConsumed;
			col += consumed;
		}
	}
	
	if (innerLineIndex > 0) {
		col += line.wrapIndentCols;
	}
	
	return [row, col];
}
