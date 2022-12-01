/*
parse JS to find out where it ends in a @{...} placeholder expression
and mark the positions of $ variables for replacement
*/

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

let quoteStates = {
	"'": states.IN_SINGLE_QUOTED_STRING,
	"\"": states.IN_DOUBLE_QUOTED_STRING,
};

function parse(string, startIndex) {
	let state = states.DEFAULT;
	let slashIsDivision = false;
	let openBraces = 0; // open braces within the main program -- if we see } and this is 0, we've reached the closing } in the @{...} expression
	let interpolationStack = []; // open braces within template string interpolations
	
	let i = startIndex;
	let ch;
	
	let dollarVariables = [];
	
	while (i < string.length) {
		ch = string[i];
		
		if (state === states.DEFAULT) {
			if (ch === "\r" || ch === "\n" || ch === "\t" || ch === " ") {
				i++;
			} else if (ch === "(" || ch === "[" || ch === "{") {
				if (ch === "{") {
					if (interpolationStack.length > 0) {
						interpolationStack[interpolationStack.length - 1]++;
					} else {
						openBraces++;
					}
				}
				
				slashIsDivision = false;
				
				i++;
			} else if (ch === ")" || ch === "]" || ch === "}") {
				if (ch === "}") {
					if (interpolationStack.length > 0) {
						if (interpolationStack.at(-1) > 0) {
							interpolationStack[interpolationStack.length - 1]--;
						} else {
							interpolationStack.pop();
							
							state = states.IN_TEMPLATE_STRING;
						}
					} else {
						if (openBraces === 0) {
							break;
						} else {
							openBraces--;
						}
					}
				}
				
				i++;
				
				if (state !== states.IN_TEMPLATE_STRING) {
					slashIsDivision = ch !== "}";
				}
			} else if (ch === "\"" || ch === "'") {
				i++;
				
				state = quoteStates[ch];
			} else if (ch === "`") {
				i++;
				
				state = states.IN_TEMPLATE_STRING;
			} else if (ch === "/" && string[i + 1] === "/") {
				i += 2;
						
				while (i < string.length) {
					ch = string[i];
					
					if (ch === "\r" || ch === "\n") {
						break;
					}
					
					i++;
				}
				
				slashIsDivision = false;
			} else if (ch === "/" && string[i + 1] === "*") {
				i += 2;
				
				state = states.IN_BLOCK_COMMENT;
			} else if (ch === "/" && slashIsDivision) {
				i++;
				
				slashIsDivision = false;
			} else if (ch === "/" && !slashIsDivision) {
				let inClass = false;
				
				i++;
				
				while (i < string.length) {
					ch = string[i];
					
					if (ch === "\\") {
						i += 2;
						
						continue;
					} else if (ch === "[") {
						inClass = true;
						
						i++;
					} else if (ch === "]") {
						inClass = false;
						
						i++;
					} else if (!inClass && ch === "/") {
						i++;
						
						break;
					} else {
						i++;
					}
				}
				
				re.regexFlags.lastIndex = i;
				
				let flags = re.regexFlags.exec(string)[0];
				
				i += flags.length;
				
				slashIsDivision = false;
			} else if (re.startWord.exec(ch)) {
				re.word.lastIndex = i;
				
				let [word] = re.word.exec(string);
				
				if (word[0] === "$") {
					dollarVariables.push(i - startIndex);
				}
				
				i += word.length;
				slashIsDivision = true;
			} else if (re.startNumber.exec(ch)) {
				re.number.lastIndex = i;
				
				let [number] = re.number.exec(string);
				
				i += number.length;
				slashIsDivision = true;
			} else {
				i++;
				slashIsDivision = false;
			}
		} else if (state === states.IN_BLOCK_COMMENT) {
			while (i < string.length) {
				ch = string[i];
				
				if (ch === "*" && string[i + 1] === "/") {
					i += 2;
					
					state = states.DEFAULT;
						
					break;
				} else {
					i++;
				}
			}
		} else if (
			state === states.IN_SINGLE_QUOTED_STRING
			|| state === states.IN_DOUBLE_QUOTED_STRING
		) {
			let quote = state === states.IN_SINGLE_QUOTED_STRING ? "'" : "\"";
			
			while (i < string.length) {
				ch = string[i];
				
				if (ch === "\\") {
					i += 2;
					
					continue;
				} else if (ch === quote || ch === "\r" || ch === "\n") {
					i++;
					
					state = states.DEFAULT;
					
					break;
				} else {
					i++;
				}
			}
		} else if (state === states.IN_TEMPLATE_STRING) {
			while (i < string.length) {
				ch = string[i];
				
				if (ch === "\\") {
					i += 2;
					
					continue;
				} else if (ch === "`") {
					i++;
					
					state = states.DEFAULT;
						
					break;
				} else if (ch === "$" && string[i + 1] === "{") {
					i += 2;
					
					interpolationStack.push(0);
					
					state = states.DEFAULT;
					
					break;
				} else {
					i++;
				}
			}
		}
	}
	
	return {
		index: i,
		dollarVariables,
	};
}

module.exports = parse;
