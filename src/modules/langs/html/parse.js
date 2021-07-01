let getIndentLevel = require("../common/utils/getIndentLevel");
let js = require("../js");
//let css = require("../css");

let re = {
	tagStart: /[a-zA-Z]/,
	tagName: /[a-zA-Z][a-zA-Z0-9]*/g,
};

let states = {
	DEFAULT: "_",
	IN_ATTRIBUTE_SINGLE: "AS",
	IN_ATTRIBUTE_DOUBLE: "AD",
	IN_COMMENT: "C",
	IN_TAG: "T",
	IN_JS: "J",
	IN_JS_ATTRIBUTE: "JA",
	IN_CSS: "S",
};

//let cssLangs = {
//	css,
//};

let stateColors = {
	[states.IN_COMMENT]: "comment",
	[states.IN_ATTRIBUTE_SINGLE]: "string",
	[states.IN_ATTRIBUTE_DOUBLE]: "string",
	[states.IN_JS_ATTRIBUTE]: "string",
};

function getCacheKey(state, cssLang) {
	return (
		state
		+ "_"
		+ cssLang
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
		inTag,
		inElement,
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
