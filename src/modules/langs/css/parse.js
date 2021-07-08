let getIndentLevel = require("../common/utils/getIndentLevel");

let re = {
};

let states = {
	DEFAULT: "_",
	IN_PROPERTIES: "P",
	IN_VALUE: "V",
	IN_COMMENT: "C",
	IN_STRING_SINGLE: "S",
	IN_STRING_DOUBLE: "D",
	IN_STRING_FUNCTION: "B", // e.g. url(...) (note - can't be multiline, so may not be necessary to have a state)
};

let stateColors = {
	[states.IN_COMMENT]: "comment",
	[states.IN_STRING_SINGLE]: "string",
	[states.IN_STRING_DOUBLE]: "string",
	[states.IN_STRING_FUNCTION]: "string",
};

function getCacheKey(state) {
	return (
		state
		+ "_"
		+ property
	);
}

function getInitialState() {
	let state = states.DEFAULT;
	let property = null;
	
	return {
		state,
		property,
		cacheKey: getCacheKey(state, property),
	};
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
		property,
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
			} else if (ch === "<" && next && next.match(re.tagStart)) {
				re.tagName.lastIndex = i + 1;
				
				let [tagName] = re.tagName.exec(lineString);
				let str = "<" + tagName;
				
				commands.push(["colour", "tag"]);
				commands.push(["string", str]);
				
				i += str.length;
				col += str.length;
				state = states.IN_TAG;
				
				inTag = {
					tagName,
				};
				
				inElement = null;
			} else if (lineString.substr(i).startsWith("<!--")) {
				commands.push(["colour", "comment"]);
				commands.push(["string", "<!--"]);
				
				i += 4;
				col += 4;
				state = states.IN_COMMENT;
				inTag = null;
				inElement = null;
			} else if (lineString.substr(i).toLowerCase().startsWith("<!doctype")) {
				// TODO
			} else {
				commands.push(["colour", "text"]);
				commands.push(["string", ch]);
				
				i++;
				col++;
				slashIsDivision = false;
			}
		} else if (state === states.IN_COMMENT) {
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
		}
	}
	
	let endState = {
		state,
		inTag,
		cacheKey: getCacheKey(state),
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
		cacheKey: getCacheKey(states.DEFAULT),
	};
	
	console.time("parse html");
	
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
		
		let indentLevel = getIndentLevel(line.string, fileDetails.indentation);
		
		line.width = col;
		line.trimmed = line.string.trimLeft();
		line.indentLevel = indentLevel.level;
		line.indentOffset = indentLevel.offset;
		line.commands = commands;
		line.endState = endState;
		
		prevState = endState;
	}
	
	console.timeEnd("parse html");
}

module.exports = {
	parse,
	stateColors,
};
