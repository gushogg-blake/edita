let Cursor = require("modules/utils/Cursor");
let AstSelection = require("modules/utils/AstSelection");
let {extend} = require("modules/astCommon/utils");
let tokenise = require("./tokenise");
let query = require("./query");

let {c} = Cursor;
let {s: a} = AstSelection;

let regexes = {};

function getRegex(pattern, flags) {
	/*
	add start assertion if necessary to anchor the regex to the current
	index, and remove g flag if present - we're only interested in a
	single match at the current index
	*/
	
	if (pattern[0] !== "^") {
		pattern = "^" + pattern;
	}
	
	flags = flags.replaceAll("g", "");
	
	if (!regexes[pattern]) {
		regexes[pattern] = {};
	}
	
	if (!regexes[pattern][flags]) {
		regexes[pattern][flags] = new RegExp(pattern, flags);
	}
	
	return regexes[pattern][flags];
}

let matchers = {
	literal(document, matches, states, token, next) {
		let {string} = token;
		let {cursor} = states.at(-1);
		let {lineIndex, offset} = cursor;
		let line = document.lines[lineIndex];
		
		if (line.string.substr(offset, string.length) !== string) {
			return false;
		}
		
		matches.push({
			token,
		});
		
		states.push({
			cursor: c(lineIndex, offset + string.length),
			indentLevel: line.indentLevel,
		});
		
		return next();
	},
	
	regex(document, matches, states, token, next) {
		let re = getRegex(token.pattern, token.flags);
		let {cursor} = states.at(-1);
		let {lineIndex, offset} = cursor;
		let line = document.lines[lineIndex];
		
		let result = re.exec(line.string.substr(offset));
		
		if (!result) {
			return false;
		}
		
		let [match] = result;
		
		matches.push({
			token,
			match,
		});
		
		states.push({
			cursor: c(lineIndex, offset + match.length),
			indentLevel: line.indentLevel,
		});
		
		return next();
	},
	
	query(document, matches, states, token, next) {
		let {cursor} = states.at(-1);
		let match = query(document, cursor, token.query);
		
		if (!match) {
			return false;
		}
		
		matches.push({
			token,
			match,
		});
		
		let {indentLevel} = document.lines[cursor.lineIndex];
		
		states.push({
			cursor: document.cursorFromIndex(document.indexFromCursor(cursor) + match.length),
			indentLevel,
		});
		
		return next();
	},
	
	newline(document, matches, states, token, next) {
		let {cursor, indentLevel} = states.at(-1);
		let line = document.lines[cursor.lineIndex];
		
		if (cursor.offset !== line.string.length || Cursor.equals(cursor, document.cursorAtEnd())) {
			return false;
		}
		
		states.push({
			cursor: document.cursorWithinBounds(c(cursor.lineIndex + 1, 0)),
			indentLevel,
		});
		
		return next();
	},
	
	indentOrDedent(document, matches, states, token, next) {
		let {cursor, indentLevel} = states.at(-1);
		
		states.push({
			cursor,
			indentLevel: indentLevel + token.dir,
		});
		
		return next();
	},
	
	lines(document, matches, states, token, next) {
		let {cursor, indentLevel} = states.at(-1);
		let {lineIndex} = cursor;
		
		while (lineIndex < document.lines.length && document.lines[lineIndex].string === "") {
			lineIndex++;
		}
		
		if (lineIndex === document.lines.length) {
			return token.zero ? next() : false;
		}
		
		let line = document.lines[lineIndex];
		
		if (line.trimmed.length === 0 || line.indentLevel !== indentLevel) {
			return token.zero ? next() : false;
		}
		
		let astSelection = a(
			lineIndex,
			extend(document, lineIndex),
		);
		
		matches.push({
			token,
			astSelection,
		});
		
		states.push({
			cursor: document.cursorWithinBounds(c(astSelection.endLineIndex, 0)),
			indentLevel,
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

function match(document, codex, startCursor) {
	startCursor = skipEmptyLines(document, startCursor);
	
	let tokens = tokenise(codex);
	
	let matches = [];
	
	let states = [
		{
			cursor: startCursor,
			indentLevel: document.lines[startCursor.lineIndex].indentLevel,
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
	
	let isMatch = next(0);
	
	if (isMatch) {
		return matches;
	} else {
		return null;
	}
}

module.exports = match;
