let keywords = [
	"break",
	"case",
	"catch",
	"class",
	"const",
	"continue",
	"debugger",
	"default",
	"delete",
	"do",
	"else",
	"enum",
	"export",
	"extends",
	"false",
	"finally",
	"for",
	"function",
	"if",
	"import",
	"in",
	"instanceof",
	"let",
	"new",
	"null",
	"return",
	"static",
	"super",
	"switch",
	"this",
	"throw",
	"true",
	"try",
	"typeof",
	"undefined",
	"var",
	"void",
	"while",
	"with",
];

let re = {
	startWord: /[a-zA-Z_$]/,
	word: /[a-zA-Z_$][a-zA-Z_$0-9]*/g,
	symbol: /[^\s\w]/,
	startNumber: /(\d|\.\d)/,
	number: /[.0-9][.0-9E]*/g,
	regexFlags: /[gmiysu]*/g,
};

let states = {
	DEFAULT: "DEFAULT",
	IN_BLOCK_COMMENT: "IN_BLOCK_COMMENT",
	IN_SINGLE_QUOTED_STRING: "IN_SINGLE_QUOTED_STRING",
	IN_DOUBLE_QUOTED_STRING: "IN_DOUBLE_QUOTED_STRING",
	IN_TEMPLATE_STRING: "IN_TEMPLATE_STRING",
};

/*
token codes:

C - set color
S - string of text
B - bracket (B instead of S is used for highlighting matching brackets)
T - tab
*/

module.exports = function(
	prefs,
	document,
	startLineIndex,
	endLineIndex,
) {
	let {
		indentWidth,
	} = prefs;
	
	for (let lineIndex = startLineIndex, lineIndex <= endLineIndex, lineIndex++) {
		let line = document.lines[lineIndex];
		
		line.commands = [];
		
		if (state === states.DEFAULT) {
			let ch;
			let start;
			let slashIsDivision; // for discerning between division and regex literal
			
			// } is opening quote for template string -- if in one
		} else if (state === states.IN_BLOCK_COMMENT) {
			// go to end or */
		} else if (state === states.IN_TEMPLATE_STRING) {
			// go to end or ${ or `
		} else if (state === states.IN_REGULAR_STRING) {
			// go to closing quote or backslash and newline
			// if ends without backslash, add a highlight for the syntax error (commands.push("Enoclosingquote"))
		}
	}
	
		ch = str[i];
		
		if (ch === "\t") {
			let tabWidth = (indentWidth - col % indentWidth);
			
			tokens.push("T" + tabWidth);
			
			col += tabWidth;
			i++;
		} else if (ch === " ") {
			tokens.push("S ");
			
			i++;
			col++;
		} else if (ch === "(" || ch === "[" || ch === "{") {
			tokens.push("Csymbol");
			tokens.push("B" + ch);
			
			slashIsDivision = false;
			i++;
			col++;
		} else if (ch === ")" || ch === "]" || ch === "}") {
			tokens.push("Csymbol");
			tokens.push("B" + ch);
			
			slashIsDivision = ch !== "}";
			
			/*
			TODO } is an opening quote for a template string if it matches
			${
			*/
			
			i++;
			col++;
		} else if (ch === "\"" || ch === "'") {
			let quote = ch;
			
			start = i;
			i++;
			
			//console.log("start string " + start);
			
			if (i < length) {
				let isEscaped = false;
				
				while (true) {
					ch = str[i];
					
					//console.log(ch);
					
					if (!isEscaped && ch === quote) {
						i++;
						col++;
						
						tokens.push("Cstring");
						tokens.push("S" + str.substring(start, i));
						
						break;
					} else if (ch === "\n") {
						tokens.push("Cstring");
						tokens.push("S" + str.substring(start, i));
						
						break;
					} else if (i === length - 1) {
						tokens.push("Cstring");
						tokens.push("S" + str.substring(start, i));
						
						break;
					}
					
					if (!isEscaped && ch === "\\") {
						isEscaped = true;
					} else {
						isEscaped = false;
					}
					
					i++;
					col++;
					
					//console.log(i);
					//console.log(length);
				}
			} else {
				tokens.push("Cstring");
				tokens.push("S" + str.substring(start, i));
			}
		} else if (ch === "`") {
			/*
			TODO
			
			use ${ as a closing quote, and matching }
			as an opening quote
			*/
			
			tokens.push("Csymbol");
			tokens.push("S`");
			
			i++;
		} else if (ch === "/" && str[i + 1] === "/") {
			start = i;
			i += 2;
			col += 2;
			
			while (true) {
				if (str[i] === "\n" || i === length) {
					tokens.push("Ccomment");
					tokens.push("S" + str.substring(start, i));
					
					break;
				}
				
				i++;
				col++;
			}
			
			slashIsDivision = false;
		} else if (ch === "/" && str[i + 1] === "*") {
			tokens.push("Ccomment");
			tokens.push("S/*");
			
			i += 2;
			col += 2;
			
			start = i;
			
			while (true) {
				ch = str[i];
				
				if (i === length) {
					if (i !== start) {
						tokens.push("S" + str.substring(start, i));
					}
					
					break;
				}
				
				if (ch === "\n") {
					if (i !== start) {
						tokens.push("S" + str.substring(start, i));
					}
					
					i++;
					col = 0;
					start = i;
				} else if (ch === "\t") {
					let tabWidth = (indentWidth - col % indentWidth);
					
					tokens.push("S" + str.substring(start, i));
					tokens.push("T" + tabWidth);
					
					i++;
					col += tabWidth;
					start = i;
				} else if (ch === "*" && str[i + 1] === "/") {
					if (i !== start) {
						tokens.push("S" + str.substring(start, i));
					}
					
					tokens.push("S*/");
					
					i += 2;
					col += 2;
					
					break;
				} else {
					i++;
				}
			}
		} else if (ch === "/") {
			if (slashIsDivision) {
				tokens.push("Csymbol");
				tokens.push("S" + ch);
				
				i++;
				col++;
			} else {
				start = i;
				
				let end;
				let inClass = false;
				
				while (true) {
					i++;
					col++;
					ch = str[i];
					
					if (i === length - 1 || ch === "\n") {
						end = i;
						
						break;
					}
					
					if (ch === "\\") {
						if (i < length - 1) {
							i++;
							col++;
						}
						
						continue;
					}
					
					if (ch === "[") {
						inClass = true;
					} else if (inClass && ch === "]") {
						inClass = false;
					} else if (!inClass && ch === "/") {
						i++;
						col++;
						
						break;
					}
				}
				
				re.regexFlags.lastIndex = i;
				
				let flagsLength = re.regexFlags.exec(str)[0].length;
				
				i += flagsLength;
				col += flagsLength;
				
				let body = str.substring(start, i);
				
				tokens.push("Cregex");
				tokens.push("S" + body);
			}
			
			slashIsDivision = false;
		} else if (re.symbol.exec(ch)) {
			tokens.push("Csymbol");
			tokens.push("S" + ch);
			
			i++;
			col++;
			slashIsDivision = false;
		} else if (re.startWord.exec(ch)) {
			re.word.lastIndex = i;
			
			let [word] = re.word.exec(str);
			
			if (keywords.includes(word)) {
				tokens.push("Ckeyword");
			} else {
				tokens.push("Cid");
			}
			
			tokens.push("S" + word);
			
			i += word.length;
			col += word.length;
			slashIsDivision = true;
		} else if (re.startNumber.exec(ch)) {
			re.number.lastIndex = i;
			
			let [number] = re.number.exec(str);
			
			tokens.push("Cnumber");
			tokens.push("S" + number);
			
			i += number.length;
			col += number.length;
			slashIsDivision = true;
		} else {
			tokens.push("Cmisc");
			tokens.push("S" + ch);
			
			i++;
			col++;
			slashIsDivision = false;
		}
		
		if (i === length) {
			break;
		}
	}
	
	return {
		string: str.substring(startAt, i),
		tokens,
		startedAt: startAt,
		stoppedAfter: i,
		startTokenIndex,
		done: i === length,
	};
}
