let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");
let createRegex = require("./createRegex");
let query = require("./query");
let tokenise = require("./tokenise");
let matchAtCursor = require("./matchAtCursor");

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
	if (!codex.trim() || document.string.trim() === "") {
		return [];
	}
	
	let tokens = tokenise(codex);
	
	let cursor = skipEmptyLines(document, Cursor.start());
	
	let queryByScope = new Map();
	
	for (let scope of document.scopes) {
		queryByScope.set(scope, query(scope));
	}
	
	let getRegex = createRegex();
	
	let results = [];
	
	while (!Cursor.equals(cursor, document.cursorAtEnd())) {
		let context = {
			getRegex,
			query: queryByScope.get(document.rangeFromCharCursor(cursor).scope),
		};
		
		let result = matchAtCursor(context, document, tokens, cursor);
		
		if (result) {
			results.push(result);
			
			cursor = result.selection.end;
		} else {
			cursor = advanceCursor(document, cursor);
		}
	}
	
	return results;
}
