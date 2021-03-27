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

function pushOpenBracesStack(openBracesStack) {
	return [
		...(openBracesStack || []),
		0,
	];
}

function popOpenBracesStack(openBracesStack) {
	if (openBracesStack.length === 1) {
		return null;
	} else {
		return openBracesStack.slice(0, -1);
	}
}

function peekOpenBracesStack(openBracesStack) {
	return openBracesStack[openBracesStack.length - 1];
}

function incrementOpenBracesStack(openBracesStack) {
	return [
		...openBracesStack.slice(0, -1),
		openBracesStack[openBracesStack.length - 1] + 1,
	];
}

function decrementOpenBracesStack(openBracesStack) {
	return [
		...openBracesStack.slice(0, -1),
		openBracesStack[openBracesStack.length - 1] - 1,
	];
}

function getCacheKey(state, slashIsDivision, openBracesStack) {
	return (
		state
		+ "_"
		+ Number(slashIsDivision)
		+ "_"
		+ (openBracesStack?.join(",") || "")
	);
}

/*
token codes:

C - set color
S - string of text
B - bracket (B instead of S is used for highlighting matching brackets)
T - tab
*/

/*
word highlighting - just search for instances of the word in the line, and highlight
them.  needs to know about tab widths!  probably best to do as an entirely separate
layer - an underlay - as opposed to here (maybe each line could store a repr of itself
with tabs replaced with spaces though, to make that much simpler?)
*/

/*
Paging

if implemented, paging should be a notional concept, not a feature of the structure of
the code -- ie it should be like an index, that exists separately and independently to
the data it indexes.
*/

function convertLineToCommands(
	prefs,
	initialState,
	lineString,
) {
	let {
		indentWidth,
	} = prefs;
	
	let {
		state,
		openBracesStack,
		slashIsDivision, // for discerning between division and regex literal
		cacheKey,
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
				
				// TODO highlight matching bracket - base on line/col?
				
				if (ch === "{" && openBracesStack) {
					openBracesStack = incrementOpenBracesStack(openBracesStack);
				}
				
				slashIsDivision = false;
				i++;
				col++;
			} else if (ch === ")" || ch === "]" || ch === "}") {
				let opener = stack[stack.length - 1];
				let nextState = state;
				
				if (ch === "}") {
					if (openBracesStack) {
						openBracesStack = decrementOpenBracesStack(openBracesStack);
						
						if (peekOpenBracesStack(openBracesStack) === 0) {
							openBracesStack = popOpenBracesStack(openBracesStack);
							
							nextState = states.IN_TEMPLATE_STRING;
						}
					}
				}
				
				commands.push("Csymbol");
				commands.push("B" + ch);
				
				if (nextState !== states.IN_TEMPLATE_STRING) {
					slashIsDivision = ch !== "}";
				}
				
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
					let start = i;
					let end;
					let inClass = false;
					
					while (true) { // TODO tabs
						i++;
						col++;
						ch = str[i];
						
						if (i === lineString.length - 1) {
							end = i;
							
							break;
						}
						
						if (ch === "\\") {
							if (i < lineString.length - 1) {
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
		} else if (
			state === states.IN_SINGLE_QUOTED_STRING
			|| state === states.IN_DOUBLE_QUOTED_STRING
		) {
			let quote = state === states.IN_SINGLE_QUOTED_STRING ? "'" : "\"";
			let isEscaped = false;
			let isClosed = false;
			let str = "";
					
			while (i < lineString.length) {
				ch = str[i];
				
				if (ch === "\t") {
					if (str) {
						commands.push("S" + str);
					}
					
					let tabWidth = (indentWidth - col % indentWidth);
					
					commands.push("T" + tabWidth);
					
					str = "";
					col += tabWidth;
					i++;
				} else if (ch === quote) {
					str += ch;
					i++;
					col++;
					
					if (!isEscaped) {
						isClosed = true;
						
						break;
					}
				} else {
					str += ch;
					i++;
					col++;
				}
				
				if (!isEscaped && ch === "\\") {
					isEscaped = true;
				} else {
					isEscaped = false;
				}
			}
			
			if (str) {
				commands.push("S" + str);
			}
			
			if (!isClosed && !isEscaped) {
				commands.push("EnoClosingQuote");
			}
			
			if (!isEscaped) {
				state = states.DEFAULT;
			}
		} else if (state === states.IN_TEMPLATE_STRING) {
			let isEscaped = false;
			let isClosed = false;
			let str = "";
					
			while (i < lineString.length) {
				ch = str[i];
				
				if (ch === "\t") {
					if (str) {
						commands.push("S" + str);
					}
					
					let tabWidth = (indentWidth - col % indentWidth);
					
					commands.push("T" + tabWidth);
					
					str = "";
					col += tabWidth;
					i++;
				} else if (ch === "`") {
					str += ch;
					i++;
					col++;
					
					if (!isEscaped) {
						isClosed = true;
						
						break;
					}
				} else if (!isEscaped && ch === "$" && lineString[i + 1] === "{") {
					commands.push("S" + str);
					
					str = "";
					
					openBracesStack = pushOpenBracesStack(openBracesStack);
					
					isClosed = true;
					
					break;
				} else {
					str += ch;
					i++;
					col++;
				}
				
				if (!isEscaped && ch === "\\") {
					isEscaped = true;
				} else {
					isEscaped = false;
				}
			}
			
			if (str) {
				commands.push("S" + str);
			}
			
			if (isClosed) {
				state = states.DEFAULT;
			}
		}
	}
	
	let endState = {
		state,
		slashIsDivision,
		openBracesStack,
		cacheKey: getCacheKey(state, slashIsDivision, openBracesStack),
	};
	
	return {
		commands,
		endState,
	};
}

module.exports = function(
	prefs,
	lines,
) {
	let prevState = startLineIndex > 0 ? document.lines[startLineIndex - 1].endState : {
		state: states.DEFAULT,
		slashIsDivision: false,
		openBracesStack: null,
		cacheKey: getCacheKey(states.DEFAULT, false, null),
	};
	
	for (let lineIndex = startIndex; lineIndex <= endIndex; lineIndex++) {
		let line = document.lines[lineIndex];
		
		let {
			commands,
			endState,
		} = convertLineToCommands(
			prefs,
			prevState,
			line.string,
		);
		
		line.commands = commands;
		line.endState = endState;
		
		prevState = endState;
	}
}
