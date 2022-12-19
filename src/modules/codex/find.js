let Cursor = require("modules/utils/Cursor");
let match = require("./match");

let {c} = Cursor;

function advanceCursor(document, cursor) {
	let {lineIndex, offset} = cursor;
	let line = document.lines[lineIndex];
	
	if (offset === line.string.length) {
		cursor = c(lineIndex + 1, 0);
	} else {
		cursor = c(lineIndex, offset + 1);
	}
	
	return cursor;
}

function skipEmptyLines(document, cursor) {
	while (cursor.lineIndex < document.lines.length && document.lines[cursor.lineIndex].string === "") {
		cursor = c(cursor.lineIndex + 1, 0);
	}
	
	return cursor;
}

module.exports = function(document, codex) {
	let cursor = skipEmptyLines(document, Cursor.start());
	
	let matches = [];
	
	while (!Cursor.equals(cursor, document.cursorAtEnd())) {
		let m = match(document, codex, cursor);
		
		if (m) {
			matches.push(m);
			
			cursor = m.endCursor;
		} else {
			cursor = advanceCursor(document, cursor);
		}
	}
	
	return matches;
}
