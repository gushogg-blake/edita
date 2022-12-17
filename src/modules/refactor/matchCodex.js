let Cursor = require("modules/utils/Cursor");
let tokeniseCodex = require("./tokeniseCodex");

let {c} = Cursor;

let matchers = {
	literal(document, matches, states, token, next) {
		let {string} = token;
		let {cursor, minIndentLevel} = states.at(-1);
		let index = document.indexFromCursor(cursor);
		
		if (document.string.substr(index, string.length) !== string) {
			return false;
		}
		
		matches.push({
			token,
		});
		
		states.push({
			cursor: document.cursorFromIndex(index + string.length),
			minIndentLevel,
		});
		
		return next();
	},
	
	newline(document, matches, states, token, next) {
		let {
			cursor,
			minIndentLevel,
		} = states.at(-1);
		
		let line = document.lines[cursor.lineIndex];
		
		if (cursor.offset !== line.string.length || Cursor.equals(cursor, document.cursorAtEnd())) {
			return false;
		}
		
		states.push({
			cursor: document.cursorWithinBounds(c(cursor.lineIndex + 1, 0)),
			minIndentLevel,
		});
		
		return next();
	},
	
	lines(document, matches, states, token, next) {
		let {
			cursor,
			minIndentLevel,
		} = states.at(-1);
		
		let {lineIndex} = cursor;
		
		while (lineIndex < document.lines.length && document.lines[lineIndex].string === "") {
			lineIndex++;
		}
		
		if (lineIndex === document.lines.length) {
			return token.zero ? next() : false;
		}
		
		let line = document.lines[lineIndex];
		
		if (line.trimmed.length === 0 || line.indentLevel < minIndentLevel) {
			return token.zero ? next() : false;
		}
		
		matches.push({
			token,
			line,
		});
		
		states.push({
			cursor: document.cursorWithinBounds(c(lineIndex + 1, 0)),
			minIndentLevel,
		});
		
		let isMatch;
		
		if (token.lazy) {
			isMatch = next() || matchers.lines(document, matches, states, token, next);
		} else {
			isMatch = matchers.lines(document, matches, states, token, next) || next();
		}
		
		if (!isMatch) {
			matches.pop();
			states.pop();
		}
		
		return isMatch;
	},
	
};

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

function skipEmptyLines(document, cursor) {
	while (cursor.lineIndex < document.lines.length && document.lines[cursor.lineIndex].string === "") {
		cursor = c(cursor.lineIndex + 1, 0);
	}
	
	return cursor;
}

function matchCodex(document, codex, startCursor) {
	startCursor = skipEmptyLines(document, startCursor);
	
	let tokens = tokeniseCodex(codex);
	
	let matches = [];
	
	let states = [
		{
			cursor: startCursor,
			minIndentLevel: document.lines[startCursor.lineIndex].indentLevel,
		},
	];
	
	function next(tokenIndex) {
		if (tokenIndex === tokens.length) {
			return true;
		}
		
		let token = tokens[tokenIndex];
		
		let isMatch = matchers[token.type](document, matches, states, token, () => next(tokenIndex + 1));
		
		return isMatch;
	}
	
	function run() {
		
	}
	
	let isMatch = next(0);
	
	if (isMatch) {
		return matches;
	} else {
		return null;
	}
}

module.exports = matchCodex;
