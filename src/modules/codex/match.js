let Cursor = require("modules/utils/Cursor");
let AstSelection = require("modules/utils/AstSelection");
let {extend} = require("modules/astCommon/utils");
let tokenise = require("./tokenise");
let query = require("./query");
let createRegex = require("./createRegex");

let {c} = Cursor;
let {s: a} = AstSelection;

let matchers = {
	literal(context, token, next) {
		let {document, matches, states} = context;
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
		
		let isMatch = next();
		
		if (!isMatch) {
			matches.pop();
			states.pop();
		}
		
		return isMatch;
	},
	
	regex(context, token, next) {
		let {document, matches, states} = context;
		let re = context.getRegex(token.pattern, token.flags);
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
		
		let isMatch = next();
		
		if (!isMatch) {
			matches.pop();
			states.pop();
		}
		
		return isMatch;
	},
	
	query(context, token, next) {
		let {document, matches, states} = context;
		let {cursor} = states.at(-1);
		let match = context.query(document, cursor, token.query);
		
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
		
		let isMatch = next();
		
		if (!isMatch) {
			matches.pop();
			states.pop();
		}
		
		return isMatch;
	},
	
	newline(context, token, next) {
		let {document, matches, states} = context;
		let {cursor, indentLevel} = states.at(-1);
		let {lineIndex, offset} = cursor;
		let line = document.lines[lineIndex];
		
		/*
		newline can be consumed from either side - it matches
		as long as we're at the beginning or end of a line
		
		I think this makes sense as a general approach anyway,
		but the reason it's required is that literal/regex/query
		matchers keep us on the line whereas lines put us on
		the next line.
		*/
		
		if (offset !== 0 && offset !== line.string.length) {
			return false;
		}
		
		states.push({
			cursor: offset === 0 ? cursor : document.cursorWithinBounds(c(lineIndex + 1, 0)),
			indentLevel,
		});
		
		let isMatch = next();
		
		if (!isMatch) {
			states.pop();
		}
		
		return isMatch;
	},
	
	indentOrDedent(context, token, next) {
		let {states} = context;
		let {cursor, indentLevel} = states.at(-1);
		
		states.push({
			cursor,
			indentLevel: indentLevel + token.dir,
		});
		
		let isMatch = next();
		
		if (!isMatch) {
			states.pop();
		}
		
		return isMatch;
	},
	
	lines(context, token, next) {
		let {document, matches, states} = context;
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
			isMatch = next() || matchers.lines(context, token, next);
		} else {
			isMatch = matchers.lines(context, token, next) || next();
		}
		
		if (!isMatch) {
			matches.pop();
			states.pop();
		}
		
		return isMatch;
	},
};

function skipEmptyLines(document, cursor) {
	while (cursor.lineIndex < document.lines.length && document.lines[cursor.lineIndex].string === "") {
		cursor = c(cursor.lineIndex + 1, 0);
	}
	
	return cursor;
}

function match(document, codex, startCursor) {
	startCursor = skipEmptyLines(document, startCursor);
	
	let tokens = tokenise(codex);
	
	let context = {
		document,
		getRegex: createRegex(),
		query: query(),
		matches: [],
		
		states: [
			{
				cursor: startCursor,
				indentLevel: document.lines[startCursor.lineIndex].indentLevel,
			},
		],
	};
	
	function next(tokenIndex) {
		if (tokenIndex === tokens.length) {
			return true;
		}
		
		let token = tokens[tokenIndex];
		
		let isMatch = matchers[token.type](context, token, () => next(tokenIndex + 1));
		
		return isMatch;
	}
	
	let isMatch = next(0);
	
	if (isMatch) {
		return context.matches;
	} else {
		return null;
	}
}

module.exports = match;
