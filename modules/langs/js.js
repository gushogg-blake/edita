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

let quoteStates = {
	"'": states.IN_SINGLE_QUOTED_STRING,
	"\"": states.IN_DOUBLE_QUOTED_STRING,
};

let openers = {
	")": "(",
	"]": "[",
	"}": "{",
};

function peek(stack) {
	return stack[stack.length - 1];
}

function pop(stack) {
	return stack.substr(0, stack.length - 1);
}

function push(stack, ch) {
	return stack + ch;
}

/*
token codes:

C - set color
S - string of text
B - bracket (B instead of S is used for highlighting matching brackets)
T - tab
*/

function parseString(lineString, quote, startIndex) {
	let isEscaped = false;
					
			while (true) {
				ch = str[i];
				
				//console.log(ch);
				
				if (!isEscaped && ch === quote) {
					i++;
					col++;
					
					commands.push("Cstring");
					commands.push("S" + str.substring(start, i));
					
					break;
				} else if (ch === "\n") {
					commands.push("Cstring");
					commands.push("S" + str.substring(start, i));
					
					break;
				} else if (i === length - 1) {
					commands.push("Cstring");
					commands.push("S" + str.substring(start, i));
					
					break;
				}
				
				if (!isEscaped && ch === "\\") {
					isEscaped = true;
				} else {
					isEscaped = false;
				}
				
				i++;
				col++;
			// go to closing quote or backslash and newline
}

function convertLineToCommands(
	prefs,
	initialState,
	lineString,
) {
	let {
		indentWidth,
	} = prefs;
	
	let {
		stack,
		state,
		slashIsDivision, // for discerning between division and regex literal
	} = initialState;
	
	let commands = [];
	let i = 0;
	let col = 0;
	let ch;
	
	while (i < lineString.length) {
		ch = lineString[i];
		
		if (state === states.DEFAULT) {
			if (ch === "\t") {
				let tabWidth = (indentWidth - col % indentWidth);
				
				commands.push("T" + tabWidth);
				
				col += tabWidth;
				i++;
			} else if (ch === " ") {
				commands.push("S ");
				
				i++;
				col++;
			} else if (ch === "(" || ch === "[" || ch === "{") {
				commands.push("Csymbol");
				commands.push("B" + ch);
				
				stack = push(stack, ch);
				
				slashIsDivision = false;
				i++;
				col++;
			} else if (ch === ")" || ch === "]" || ch === "}") {
				let opener = stack[stack.length - 1];
				let nextState = state;
				
				if (opener === openers[ch]) {
					stack = pop(stack);
				} else if (opener === "$" && ch === "}") {
					stack = pop(stack);
					
					nextState = states.IN_TEMPLATE_STRING;
				}
				
				if (nextState === states.IN_TEMPLATE_STRING) {
					commands.push("Cstring");
					commands.push("S}");
				} else {
					commands.push("Csymbol");
					commands.push("B" + ch);
				}
				
				slashIsDivision = ch !== "}"; // TODO does this work with IN_TEMPLATE_STRING?
				
				i++;
				col++;
				state = nextState;
			} else if (ch === "\"" || ch === "'") {
				commands.push("Cstring");
				commands.push("S" + ch);
				
				i++;
				col++;
				state = quoteStates[ch];
			} else if (ch === "`") {
				commands.push("Cstring");
				commands.push("S`");
				
				i++;
				col++;
				state = states.IN_TEMPLATE_STRING;
			} else if (ch === "/" && lineString[i + 1] === "/") {
				commands.push("Ccomment");
				commands.push("S" + lineString.substring(i));
				
				slashIsDivision = false;
				
				break;
			} else if (ch === "/" && str[i + 1] === "*") {
				commands.push("Ccomment");
				commands.push("S/*");
				
				i += 2;
				col += 2;
				state = states.IN_BLOCK_COMMENT;
			} else if (ch === "/") {
				if (slashIsDivision) {
					commands.push("Csymbol");
					commands.push("S" + ch);
					
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
					
					commands.push("Cregex");
					commands.push("S" + body);
				}
				
				slashIsDivision = false;
			} else if (re.symbol.exec(ch)) {
				commands.push("Csymbol");
				commands.push("S" + ch);
				
				i++;
				col++;
				slashIsDivision = false;
			} else if (re.startWord.exec(ch)) {
				re.word.lastIndex = i;
				
				let [word] = re.word.exec(str);
				
				if (keywords.includes(word)) {
					commands.push("Ckeyword");
				} else {
					commands.push("Cid");
				}
				
				commands.push("S" + word);
				
				i += word.length;
				col += word.length;
				slashIsDivision = true;
			} else if (re.startNumber.exec(ch)) {
				re.number.lastIndex = i;
				
				let [number] = re.number.exec(str);
				
				commands.push("Cnumber");
				commands.push("S" + number);
				
				i += number.length;
				col += number.length;
				slashIsDivision = true;
			} else {
				commands.push("Cmisc");
				commands.push("S" + ch);
				
				i++;
				col++;
				slashIsDivision = false;
			}
		} else if (state === states.IN_BLOCK_COMMENT) {
			// go to end or */
			/*
			} else if (ch === "\t") {
						let tabWidth = (indentWidth - col % indentWidth);
						
						commands.push("S" + str.substring(start, i));
						commands.push("T" + tabWidth);
						
						i++;
						col += tabWidth;
						start = i;
					} else if (ch === "*" && str[i + 1] === "/") {
						if (i !== start) {
							commands.push("S" + str.substring(start, i));
						}
						
						commands.push("S*" + "/"); // 
						
						i += 2;
						col += 2;
						
						break;
					} else {
						i++;
					}
				}
			*/
		} else if (state === states.IN_SINGLE_QUOTED_STRING) {
			let {
				isEscaped,
				isClosed,
				endIndex,
			} = parseString(commands, lineString, "'", i);
			
			
			if (isEscaped) {
				break;
			}
			// if ends without backslash, add a highlight for the syntax error (commands.push("Enoclosingquote"))
		} else if (state === states.IN_SINGLE_QUOTED_STRING) {
			// go to closing quote or backslash and newline
			// if ends without backslash, add a highlight for the syntax error (commands.push("Enoclosingquote"))
		} else if (state === states.IN_TEMPLATE_STRING) {
			
			// go to end or ${ or `
		}
	}
	
	return {
		commands,
		
		endState: {
			state,
			slashIsDivision,
		},
	};
}

module.exports = function(
	prefs,
	document,
	startLineIndex,
	endLineIndex,
) {
	let stack = []; // keep track of brackets, braces, quotes, etc
	
	let prevState = startLineIndex > 0 ? document.lines[startLineIndex - 1].endState : {
		state: states.DEFAULT,
	};
	
	for (let lineIndex = startLineIndex; lineIndex <= endLineIndex; lineIndex++) {
		let line = document.lines[lineIndex];
		
		let {
			commands,
			endState,
		} = convertLineToCommands(
			prefs,
			prevState,
			line.string,
			stack,
		);
		
		line.commands = commands;
		line.endState = endState;
		
		prevState = endState;
	}
}
