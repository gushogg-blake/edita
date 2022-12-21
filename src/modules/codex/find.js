let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");
let createRegex = require("./createRegex");
let query = require("./query");
let tokenise = require("./tokenise");
let match = require("./match");

let {s} = Selection;
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
	if (!codex.trim()) {
		return [];
	}
	
	let tokens = tokenise(codex);
	
	let cursor = skipEmptyLines(document, Cursor.start());
	
	let context = {
		query: query(),
		getRegex: createRegex(),
	};
	
	let results = [];
	
	while (!Cursor.equals(cursor, document.cursorAtEnd())) {
		let m = match(context,document, tokens, cursor);
		
		if (m) {
			let {matches, endCursor} = m;
			
			results.push({
				matches,
				selection: s(cursor, endCursor),
			});
			
			cursor = m.endCursor;
		} else {
			cursor = advanceCursor(document, cursor);
		}
	}
	
	return results;
}
