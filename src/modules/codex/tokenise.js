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

function isAtStartOfLine(str, index) {
	for (let i = index - 1; i > 0; i--) {
		let ch = str[i];
		
		if ("\r\n".includes(ch)) {
			return true;
		} else if (!" \t".includes(ch)) {
			return false;
		}
	}
	
	return true;
}

function tokenise(string) {
	let tokens = [];
	
	let state = states.DEFAULT;
	let openBrackets = 0; // open brackets within a query - if we see ) and this is 1, we've reached the closing )
	
	let queryStartIndex;
	let literal = "";
	let indent = 0;
	let indentLevels = new Set();
	
	let i = 0;
	let ch;
	
	let identifierRe = /[\w_]+/g;
	let regexFlagsRe = /[gmiysu]*/g;
	
	function lineIsEmpty() {
		let ch = string[i];
		
		return ch && "\r\n".includes(ch);
	}
	
	function addLiteral() {
		if (literal) {
			tokens.push({
				type: "literal",
				string: literal,
			});
		}
		
		literal = "";
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
		re.lastIndex = i;
		
		let match = re.exec(string)?.[0] || "";
		
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
	
	consumeAndAddIndentOrDedent();
	
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
				
				consumeAndAddIndentOrDedent();
			} else if (ch === "\\") {
				literal += string[i + 1] || "";
				
				i += 2;
			} else if (ch === "[") {
				addLiteral();
				
				tokens.push({
					type: "replaceStart",
				});
				
				i++;
			} else if (ch === "]") {
				addLiteral();
				
				tokens.push({
					type: "replaceEnd",
				});
				
				i++;
			} else if (ch === "(") {
				openBrackets++;
				
				queryStartIndex = i;
				
				addLiteral();
				
				i++;
				
				state = states.IN_QUERY;
			} else if ("*+@".includes(ch) && isAtStartOfLine(string, i)) {
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
				addLiteral();
				
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
	
	addLiteral();
	
	while (tokens.at(-1)?.type === "newline") {
		tokens.pop();
	}
	
	return tokens;
}

module.exports = tokenise;
