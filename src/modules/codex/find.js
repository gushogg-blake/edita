let match = require("./match");

function advanceCursor(document, cursor) {
	if (Cursor.equals(cursor, document.cursorAtEnd())) {
		return null;
	}
	
	let {lineIndex, offset} = cursor;
	let line = document.lines[lineIndex];
	
	if (offset === line.string.length) {
		cursor = c(lineIndex + 1, 0);
	} else {
		cursor = c(lineIndex, offset + 1);
	}
	
	return cursor;
}

module.exports = function(document, codex) {
	
}
