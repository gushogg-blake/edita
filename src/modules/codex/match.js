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
			cursor: document.cursorFromIndex(document.indexFromCursor(cursor) + match.node.text.length),
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
		matchers keep us on the line whereas lines puts us on
		the next line.
		*/
		
		if (offset !== 0 && offset !== line.string.length) {
			return false;
		}
		
		/*
		skip blank lines
		
		multiple newlines in the query result in a single newline, so this is
		needed situations like this:
		
		code:
		
			literal
			123
			456
			
			anotherLiteral
			456
			567
		
		query:
		
			literal
			+
			anotherLiteral
			+
		
		in this situation, if a newline token simply took us to the next line,
		the newline after the first + would take us to the blank line below "456"
		in the code, and then the "anotherLiteral" literal wouldn't match
		*/
		
		let newCursor = offset === 0 ? cursor : document.cursorWithinBounds(c(lineIndex + 1, 0));
		
		while (!Cursor.equals(newCursor, document.cursorAtEnd()) && document.lines[newCursor.lineIndex].trimmed.length === 0) {
			newCursor = document.cursorWithinBounds(c(newCursor.lineIndex + 1, 0));
		}
		
		states.push({
			cursor: newCursor,
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

function match(document, codex, startCursor) {
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
		let {matches, states} = context;
		let {cursor} = states.at(-1);
		
		return {
			startCursor,
			endCursor: cursor,
			matches,
		};
	} else {
		return null;
	}
}

module.exports = match;
