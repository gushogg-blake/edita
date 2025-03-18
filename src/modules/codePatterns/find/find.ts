import Selection, {s} from "modules/Selection";
import Cursor, {c} from "modules/Cursor";
import createRegex from "./createRegex";
import query from "./query";
import tokenise from "./tokenise";
import matchAtCursor from "./matchAtCursor";

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
	while (cursor.lineIndex < document.lines.length && document.lines[cursor.lineIndex].isEmpty) {
		cursor = c(cursor.lineIndex + 1, 0);
	}
	
	return cursor;
}

export default function(document, codePattern) {
	if (!codePattern.trim() || !document.string.trim()) {
		return [];
	}
	
	let tokens = tokenise(codePattern);
	
	let cursor = skipEmptyLines(document, Cursor.start());
	
	let queryByScope = new Map();
	
	for (let scope of document.scopes) {
		queryByScope.set(scope, query(scope));
	}
	
	let getRegex = createRegex();
	
	let results = [];
	
	while (!cursor.equals(document.cursorAtEnd())) {
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
