let ParseError = require("./ParseError");

/*
tokenise a codex expression

syntax:

(...) @node - tree-sitter query
[ - start range to be replaced
] - end range to be replaced

* - 0 or more lines, greedy
*? - 0 or more lines, lazy
+ - 1 or more lines, greedy
+? - 1 or more lines, lazy

* and + can be followed by a capture group, e.g.

	+? @lines

to make them available in the replacement

lines must appear on their own line

@capture (on its own line) - shorthand for * @capture

regex literals - /\w+/@id

indentation - sets the indentation level relative to the
starting indentation level of the matched code, e.g.

function /\w+/@name\() {
	@body
}

query limitations:

- when capturing repeated nodes, only the last node will be captured

- capture names can't contain dashes
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

function tokenise(string) {
	let tokens = [];
	
	let state = states.DEFAULT;
	let openBrackets = 0; // open brackets within a query - if we see ) and this is 1, we've reached the closing )
	
	let queryStartIndex;
	let literal = "";
	let indent = 0;
	let hasReplaceStart = false;
	let hasReplaceEnd = false;
	
	let i = 0;
	let ch;
	
	let identifierRe = /^[\w_]+/;
	let regexFlagsRe = /^[gmiysu]*/;
	let queryQuantifierRe = /^[*+?]/;
	
	function lineIsEmpty() {
		let ch = string[i];
		
		return ch && "\r\n".includes(ch);
	}
	
	function isAtStartOfLine() {
		for (let i = tokens.length - 1; i >= 0; i--) {
			let token = tokens[i];
			
			if (token.type === "newline") {
				return true;
			} else if (!["indentOrDedent", "replaceStart", "replaceEnd"].includes(token.type)) {
				return false;
			}
		}
		
		return true;
	}
	
	function consumeAndAddIndentOrDedent() {
		if (lineIsEmpty()) {
			return;
		}
		
		let n = countIndentChars(string, i);
		
		if (n !== indent) {
			tokens.push({
				type: "indentOrDedent",
				dir: n < indent ? -1 : 1,
			});
		}
		
		indent = n;
		
		i += n;
		
		ch = string[i];
	}
	
	function consumeString(str) {
		if (string.substr(i, str.length) === str) {
			i += str.length;
			
			ch = string[i];
			
			return true;
		}
		
		return false;
	}
	
	function consumeRe(re) {
		let match = string.substr(i).match(re)?.[0] || "";
		
		i += match.length;
		
		ch = string[i];
		
		return match;
	}
	
	function skipWhitespace() {
		while (" \t".includes(string[i])) {
			i++;
			
			ch = string[i];
		}
	}
	
	function consumeCaptureLabel() {
		if (consumeString("@")) {
			return consumeRe(identifierRe);
		} else {
			return null;
		}
	}
	
	function consumeQueryQuantifier() {
		consumeRe(queryQuantifierRe);
	}
	
	function addLiteral(ch) {
		let lastToken = tokens.at(-1);
		
		if (lastToken?.type === "literal") {
			lastToken.string += ch;
		} else {
			tokens.push({
				type: "literal",
				string: ch,
			});
		}
	}
	
	consumeAndAddIndentOrDedent();
	
	while (i < string.length) {
		ch = string[i];
		
		if (state === states.DEFAULT) {
			if ("\r\n".includes(ch)) {
				if (tokens.length > 0 && tokens.at(-1)?.type !== "newline") {
					tokens.push({
						type: "newline",
					});
				}
				
				do {
					i++;
					
					ch = string[i];
				} while ("\r\n".includes(ch));
				
				consumeAndAddIndentOrDedent();
			} else if (ch === "\\") {
				addLiteral(string[i + 1] || "");
				
				i += 2;
			} else if (ch === "[") {
				if (hasReplaceStart) {
					throw new ParseError("Unexpected [ (replace start) - only one allowed");
				}
				
				tokens.push({
					type: "replaceStart",
				});
				
				hasReplaceStart = true;
				
				i++;
			} else if (ch === "]") {
				if (hasReplaceEnd) {
					throw new ParseError("Unexpected ] (replace end) - only one allowed");
				}
				
				tokens.push({
					type: "replaceEnd",
				});
				
				hasReplaceEnd = true;
				
				i++;
			} else if (ch === "(") {
				openBrackets++;
				
				queryStartIndex = i;
				
				i++;
				
				state = states.IN_QUERY;
			} else if ("*+@".includes(ch) && isAtStartOfLine()) {
				let zero;
				let lazy;
				let capture;
				
				if (ch === "@") { // shorthand for * @...
					zero = true;
					lazy = false;
					capture = consumeCaptureLabel();
				} else {
					zero = ch === "*";
					
					i++;
					
					lazy = consumeString("?");
					
					skipWhitespace();
					
					capture = consumeCaptureLabel();
				}
				
				tokens.push({
					type: "lines",
					zero,
					lazy,
					capture,
				});
			} else if (ch === "/") {
				let startIndex = i;
				let inClass = false;
				
				i++;
				
				while (i < string.length) {
					ch = string[i];
					
					if ("\r\n".includes(ch)) {
						throw new ParseError("Unterminated regex");
					} else if (ch === "\\") {
						i++;
						
						if (i < string.length && !"\r\n".includes(string[i + 1])) {
							i++;
						}
						
						continue;
					} else if (ch === "[") {
						inClass = true;
					} else if (ch === "]") {
						inClass = false;
					} else if (!inClass && ch === "/") {
						i++;
						
						break;
					}
					
					i++;
				}
				
				let pattern = string.substring(startIndex + 1, i - 1);
				
				let flags = consumeRe(regexFlagsRe);
				
				i += flags.length;
				
				let capture = consumeCaptureLabel();
				
				tokens.push({
					type: "regex",
					pattern,
					flags,
					capture,
				});
			} else {
				addLiteral(ch);
				
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
					consumeQueryQuantifier();
					skipWhitespace();
					consumeCaptureLabel();
					
					tokens.push({
						type: "query",
						query: string.substring(queryStartIndex, i),
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
		throw new ParseError("Unterminated query - expecting closing )");
	}
	
	while (tokens.at(-1)?.type === "newline") {
		tokens.pop();
	}
	
	return tokens;
}

module.exports = tokenise;
