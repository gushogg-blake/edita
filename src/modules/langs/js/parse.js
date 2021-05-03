let getIndentLevel = require("../common/utils/getIndentLevel");
let getOpenersAndClosersOnLine = require("../common/codeIntel/getOpenersAndClosersOnLine");

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
	DEFAULT: "_",
	IN_BLOCK_COMMENT: "B",
	IN_SINGLE_QUOTED_STRING: "S",
	IN_DOUBLE_QUOTED_STRING: "D",
	IN_TEMPLATE_STRING: "T",
};

let stateColors = {
	[states.IN_BLOCK_COMMENT]: "comment",
	[states.IN_SINGLE_QUOTED_STRING]: "string",
	[states.IN_DOUBLE_QUOTED_STRING]: "string",
	[states.IN_TEMPLATE_STRING]: "string",
};

let quoteStates = {
	"'": states.IN_SINGLE_QUOTED_STRING,
	"\"": states.IN_DOUBLE_QUOTED_STRING,
};

/*
open braces stack - for keeping track of template string interpolations
(${ switches to  default state and matching } switches back to template string
state)
*/

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

/*
cache key - string representation of the entire state after parsing a line

this is used to check whether we need to re-parse a line - if a line hasn't
changed then it only needs re-parsing if the previous line's state has changed
since we last cached the parse result

since there are not many different likely end states, we can cache multiple
results to save time in the common cases, ie. it's likely that slashIsDivision
and openBracesStack with stay the same and state will toggle between DEFAULT,
IN_TEMPLATE_STRING, and IN_BLOCK_COMMENT
*/

function getCacheKey(state, slashIsDivision, openBracesStack) {
	return (
		state
		+ "_"
		+ Number(slashIsDivision)
		+ "_"
		+ (openBracesStack?.join(",") || "")
	);
}

function convertLineToCommands(
	prefs,
	initialState,
	lineString,
) {
	let {
		tabWidth,
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
				let width = (tabWidth - col % tabWidth);
				
				commands.push(["tab", width]);
				
				col += width;
				i++;
			} else if (ch === " ") {
				commands.push(["string", " "]);
				
				i++;
				col++;
			} else if (ch === "(" || ch === "[" || ch === "{") {
				commands.push(["open", ch]);
				commands.push(["colour", "symbol"]);
				commands.push(["string", ch]);
				
				if (ch === "{" && openBracesStack) {
					openBracesStack = incrementOpenBracesStack(openBracesStack);
				}
				
				slashIsDivision = false;
				i++;
				col++;
			} else if (ch === ")" || ch === "]" || ch === "}") {
				commands.push(["close", ch]);
				commands.push(["colour", "symbol"]);
				commands.push(["string", ch]);
				
				i++;
				col++;
				
				if (ch === "}") {
					if (openBracesStack) {
						openBracesStack = decrementOpenBracesStack(openBracesStack);
						
						if (peekOpenBracesStack(openBracesStack) === 0) {
							openBracesStack = popOpenBracesStack(openBracesStack);
							
							state = states.IN_TEMPLATE_STRING;
						}
					}
				}
				
				if (state !== states.IN_TEMPLATE_STRING) {
					slashIsDivision = ch !== "}";
				}
				
				if (state === states.IN_TEMPLATE_STRING) {
					commands.push(["colour", "string"]);
				}
			} else if (ch === "\"" || ch === "'") {
				commands.push(["colour", "string"]);
				commands.push(["string", ch]);
				
				i++;
				col++;
				state = quoteStates[ch];
			} else if (ch === "`") {
				commands.push(["open", ch]);
				commands.push(["colour", "string"]);
				commands.push(["string", ch]);
				
				i++;
				col++;
				state = states.IN_TEMPLATE_STRING;
			} else if (ch === "/" && lineString[i + 1] === "/") {
				commands.push(["colour", "comment"]);
				
				let str = "//";
				
				i += 2;
				col += 2;
						
				while (i < lineString.length) {
					ch = lineString[i];
					
					if (ch === "\t") {
						if (str) {
							commands.push(["string", str]);
						}
						
						let width = (tabWidth - col % tabWidth);
						
						commands.push(["tab", width]);
						
						str = "";
						col += width;
						i++;
					} else {
						str += ch;
						i++;
						col++;
					}
				}
				
				if (str) {
					commands.push(["string", str]);
				}
				
				slashIsDivision = false;
			} else if (ch === "/" && lineString[i + 1] === "*") {
				commands.push(["colour", "comment"]);
				commands.push(["string", "/*"]);
				
				i += 2;
				col += 2;
				state = states.IN_BLOCK_COMMENT;
			} else if (ch === "/" && slashIsDivision) {
				commands.push(["colour", "symbol"]);
				commands.push(["string", ch]);
				
				slashIsDivision = false;
				i++;
				col++;
			} else if (ch === "/" && !slashIsDivision) {
				commands.push(["colour", "regex"]);
				
				let str = "/";
				let isEscaped = false;
				let inClass = false;
				
				i++;
				col++;
				
				while (i < lineString.length) {
					ch = lineString[i];
					
					if (ch === "\\") {
						str += ch;
						i++;
						col++;
						
						isEscaped = true;
						
						continue;
					} else if (!isEscaped && ch === "[") {
						inClass = true;
						
						str += ch;
						i++;
						col++;
					} else if (!isEscaped && ch === "]") {
						inClass = false;
						
						str += ch;
						i++;
						col++;
					} else if (!isEscaped && !inClass && ch === "/") {
						str += ch;
						i++;
						col++;
						
						break;
					} else if (ch === "\t") {
						if (str) {
							commands.push(["string", str]);
						}
						
						let width = (tabWidth - col % tabWidth);
						
						commands.push(["tab", width]);
						
						str = "";
						col += width;
						i++;
					} else {
						str += ch;
						i++;
						col++;
					}
				}
				
				re.regexFlags.lastIndex = i;
				
				let flags = re.regexFlags.exec(lineString)[0];
				
				i += flags.length;
				col += flags.length;
				
				commands.push(["string", str + flags]);
				
				slashIsDivision = false;
			} else if (re.startWord.exec(ch)) {
				re.word.lastIndex = i;
				
				let [word] = re.word.exec(lineString);
				
				if (keywords.includes(word)) {
					commands.push(["colour", "keyword"]);
				} else {
					commands.push(["colour", "id"]);
				}
				
				commands.push(["string", word]);
				
				i += word.length;
				col += word.length;
				slashIsDivision = true;
			} else if (re.startNumber.exec(ch)) {
				re.number.lastIndex = i;
				
				let [number] = re.number.exec(lineString);
				
				commands.push(["colour", "number"]);
				commands.push(["string", number]);
				
				i += number.length;
				col += number.length;
				slashIsDivision = true;
			} else if (re.symbol.exec(ch)) {
				commands.push(["colour", "symbol"]);
				commands.push(["string", ch]);
				
				i++;
				col++;
				slashIsDivision = false;
			} else {
				commands.push(["colour", "misc"]);
				commands.push(["string", ch]);
				
				i++;
				col++;
				slashIsDivision = false;
			}
		} else if (state === states.IN_BLOCK_COMMENT) {
			let str = "";
			let isClosed = false;
					
			while (i < lineString.length) {
				ch = lineString[i];
				
				if (ch === "\t") {
					if (str) {
						commands.push(["string", str]);
					}
					
					let width = (tabWidth - col % tabWidth);
					
					commands.push(["tab", width]);
					
					str = "";
					col += width;
					i++;
				} else if (ch === "*" && lineString[i + 1] === "/") {
					str += "*/";
					i += 2;
					col += 2;
					
					isClosed = true;
						
					break;
				} else {
					str += ch;
					i++;
					col++;
				}
			}
			
			if (str) {
				commands.push(["string", str]);
			}
			
			if (isClosed) {
				state = states.DEFAULT;
			}
		} else if (
			state === states.IN_SINGLE_QUOTED_STRING
			|| state === states.IN_DOUBLE_QUOTED_STRING
		) {
			let quote = state === states.IN_SINGLE_QUOTED_STRING ? "'" : "\"";
			let isEscaped = false;
			let isClosed = false;
			let str = "";
					
			while (i < lineString.length) {
				ch = lineString[i];
				
				if (ch === "\\") {
					str += ch;
					i++;
					col++;
					
					isEscaped = true;
					
					continue;
				} else if (ch === "\t") {
					if (str) {
						commands.push(["string", str]);
					}
					
					let width = (tabWidth - col % tabWidth);
					
					commands.push(["tab", width]);
					
					str = "";
					col += width;
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
				
				isEscaped = false;
			}
			
			if (str) {
				commands.push(["string", str]);
			}
			
			if (!isClosed && !isEscaped) {
				commands.push(["error", "noClosingQuote"]);
			}
			
			if (!isEscaped) {
				state = states.DEFAULT;
			}
		} else if (state === states.IN_TEMPLATE_STRING) {
			let isEscaped = false;
			let inInterpolation = false;
			let reachedClosingQuote = false;
			let str = "";
					
			while (i < lineString.length) {
				ch = lineString[i];
				
				if (ch === "\\") {
					str += ch;
					i++;
					col++;
					
					isEscaped = true;
					
					continue;
				} else if (ch === "\t") {
					if (str) {
						commands.push(["string", str]);
					}
					
					let width = (tabWidth - col % tabWidth);
					
					commands.push(["tab", width]);
					
					str = "";
					col += width;
					i++;
				} else if (ch === "`") {
					if (isEscaped) {
						str += ch;
						i++;
						col++;
					} else {
						reachedClosingQuote = true;
						
						break;
					}
				} else if (!isEscaped && ch === "$" && lineString[i + 1] === "{") {
					commands.push(["string", str]);
					
					str = "";
					
					openBracesStack = pushOpenBracesStack(openBracesStack);
					
					inInterpolation = true;
					
					break;
				} else {
					str += ch;
					i++;
					col++;
				}
				
				isEscaped = false;
			}
			
			if (str) {
				commands.push(["string", str]);
			}
			
			if (reachedClosingQuote) {
				commands.push(["close", "`"]);
				commands.push(["string", "`"]);
				i++;
				col++;
			}
			
			if (inInterpolation || reachedClosingQuote) {
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
		col,
		commands,
		endState,
	};
}

function parse(
	lines,
	prefs,
	fileDetails,
	startIndex=0,
	endIndex=null,
) {
	if (endIndex === null) {
		endIndex = lines.length - 1;
	}
	
	let prevState = startIndex > 0 ? lines[startIndex - 1].endState : {
		state: states.DEFAULT,
		slashIsDivision: false,
		openBracesStack: null,
		cacheKey: getCacheKey(states.DEFAULT, false, null),
	};
	console.time("parse");
	for (let lineIndex = startIndex; lineIndex <= endIndex; lineIndex++) {
		let line = lines[lineIndex];
		
		let {
			col,
			commands,
			endState,
		} = convertLineToCommands(
			prefs,
			prevState,
			line.string,
		);
		
		line.width = col;
		line.trimmed = line.string.trimLeft();
		line.indentLevel = getIndentLevel(line.string, fileDetails.indentation);
		line.commands = commands;
		line.endState = endState;
		
		//Object.assign(line, getOpenersAndClosersOnLine(line)); // perf
		
		prevState = endState;
	}
	console.timeEnd("parse");
}

module.exports = {
	parse,
	stateColors,
};
