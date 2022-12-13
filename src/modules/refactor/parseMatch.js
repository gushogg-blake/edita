let gcd = require("utils/gcd");

/*
parse a match description to separate the literals and the queries

an unescaped ( starts a query and its closing ) closes it -- opening
brackets in code must be escaped, e.g. fn\()
*/

let states = {
	DEFAULT: "_",
	IN_QUERY: "Q",
};

function countIndentChars(str, startIndex) {
	let n = 0;
	
	for (let i = startIndex; i < str.length; i++) {
		let ch = str[i];
		
		if (" \t".includes(ch)) {
			n++;
		} else {
			break;
		}
	}
	
	return n;
}

function lineIsEmpty(str, startIndex) {
	let hasChars = false;
	
	for (let i = startIndex; i < str.length; i++) {
		let ch = str[i];
		
		if ("\r\n".includes(ch)) {
			break;
		}
		
		if (!" \t".includes(ch)) {
			hasChars = true;
		}
	}
	
	return !hasChars;
}

function parse(string) {
	let tokens = [];
	
	let state = states.DEFAULT;
	let openBrackets = 0; // open brackets within a query - if we see ) and this is 1, we've reached the closing )
	
	let queryStartIndex;
	let literal = "";
	let indent = 0;
	let indentLevels = new Set();
	
	let i = 0;
	let ch;
	
	function addLiteral() {
		if (literal) {
			tokens.push({
				type: "literal",
				string: literal,
			});
		}
		
		literal = "";
	}
	
	function setIndent() {
		if (lineIsEmpty(string, i)) {
			return;
		}
		
		let n = countIndentChars(string, i);
		
		if (n !== indent) {
			tokens.push({
				type: "indent",
				level: n,
			});
			
			indent = n;
			
			if (indent !== 0) {
				indentLevels.add(indent);
			}
		}
		
		i += n;
		
		ch = string[i];
	}
	
	setIndent();
	
	while (i < string.length) {
		ch = string[i];
		
		if (state === states.DEFAULT) {
			if ("\r\n".includes(ch)) {
				addLiteral();
				
				if (tokens.length > 0 && tokens.at(-1)?.type !== "newline") {
					tokens.push({
						type: "newline",
					});
				}
				
				do {
					i++;
					
					ch = string[i];
				} while ("\r\n".includes(ch));
				
				setIndent();
			} else if (ch === "\\") {
				literal += string[i + 1] || "";
				
				i += 2;
			} else if (ch === "(") {
				openBrackets++;
				
				queryStartIndex = i;
				
				addLiteral();
				
				i++;
				
				state = states.IN_QUERY;
			} else {
				literal += ch;
				
				i++;
			}
		} else if (state === states.IN_QUERY) {
			if (ch === "(") {
				openBrackets++;
				
				i++;
			} else if (ch === ")") {
				openBrackets--;
				
				i++;
				
				if (openBrackets === 0) {
					tokens.push({
						type: "query",
						string: string.substring(queryStartIndex, i),
					});
					
					state = states.DEFAULT;
				}
			} else if (ch === ";") {
				i++;
						
				while (i < string.length && !"\r\n".includes(string[i])) {
					i++;
				}
			} else if (ch === "\"") {
				i++;
				
				while (i < string.length) {
					ch = string[i];
					
					if (ch === "\\") {
						i += 2;
						
						continue;
					} else if (ch === "\"" || ch === "\r" || ch === "\n") {
						i++;
						
						break;
					} else {
						i++;
					}
				}
			} else {
				i++;
			}
		}
	}
	
	if (openBrackets > 0) {
		throw new Error("Unterminated query - expecting closing )");
	}
	
	addLiteral();
	
	while (tokens.at(-1)?.type === "newline") {
		tokens.pop();
	}
	
	// normalise indents
	
	let f = gcd(...indentLevels);
	
	for (let token of tokens) {
		if (token.type === "indent") {
			token.level /= f;
		}
	}
	
	return tokens;
}

module.exports = parse;
