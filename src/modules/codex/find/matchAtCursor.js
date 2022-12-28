let Selection = require("modules/Selection");
let matchers = require("./matchers");

let {s} = Selection;

module.exports = function(context, document, tokens, cursor) {
	let {getRegex, query} = context;
	
	context = {
		document,
		getRegex,
		query,
		matches: [],
		
		states: [
			{
				cursor,
				indentLevel: document.lines[cursor.lineIndex].indentLevel,
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
		let {cursor: endCursor} = states.at(-1);
		let selection = s(cursor, endCursor);
		let {start: replaceStart, end: replaceEnd} = selection;
		
		for (let match of matches) {
			let {type} = match.token;
			
			if (type === "replaceStart") {
				replaceStart = match.cursor;
			} else if (type === "replaceEnd") {
				replaceEnd = match.cursor;
			}
		}
		
		return {
			matches,
			selection,
			replaceSelection: s(replaceStart, replaceEnd),
		};
	} else {
		return null;
	}
}
