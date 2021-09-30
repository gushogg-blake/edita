let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");
let Document = require("modules/Document");
let parseJavaScript = require("./parseJavaScript");
let Tabstop = require("./Tabstop");
let Expression = require("./Expression");

let {s} = Selection;
let {c} = Cursor;

function getPlaceholders(string) {
	let placeholders = [];
	
	let i = 0;
	let ch;
	
	while (i < string.length) {
		let ch = string[i];
		let next = string[i + 1];
		
		if (ch === "@" && next) {
			if (next === "{") {
				let nameWithDefault = string.substr(i + "@{".length).match(/^([$\w]+)(?=:)/);
				
				if (nameWithDefault) {
					// @{name:defaultExpression}
					
					let [, name] = nameWithDefault;
					let start = i;
					let expressionStart = start + "@{".length + name.length + ":".length;
					let {index: expressionEnd, dollarVariables} = parseJavaScript(string, expressionStart);
					let expression = string.substring(expressionStart, expressionEnd);
					let end = Math.min(string.length, expressionEnd + "}".length);
					
					placeholders.push(new Tabstop(start, end, name, expression, dollarVariables));
					
					i = end;
				} else {
					// @{expression}
					
					let start = i;
					let expressionStart = start + "@{".length;
					let {index: expressionEnd, dollarVariables} = parseJavaScript(string, expressionStart);
					let expression = string.substring(expressionStart, expressionEnd);
					let end = Math.min(string.length, expressionEnd + "}".length);
					
					placeholders.push(new Expression(start, end, expression, dollarVariables));
					
					i = end;
				}
			} else if (next.match(/[$\w]/)) {
				// @name
				
				let [, name] = string.substr(i + "@".length).match(/^([$\w]+)/);
				let start = i;
				let end = start + "@".length + name.length;
				
				placeholders.push(new Tabstop(start, end, name, null));
				
				i = end;
			} else {
				i += 2;
				
				continue;
			}
		} else {
			i++;
		}
	}
	
	return placeholders;
}

module.exports = function(string, baseLineIndex=0, baseOffset=0) {
	let placeholders = getPlaceholders(string);
	
	let replacedString = "";
	
	let prevPlaceholderEnd = 0;
	
	for (let placeholder of placeholders) {
		replacedString += string.substring(prevPlaceholderEnd, placeholder.start);
		
		prevPlaceholderEnd = placeholder.end;
	}
	
	replacedString += string.substr(prevPlaceholderEnd);
	
	let offset = 0;
	
	for (let placeholder of placeholders) {
		placeholder.indexInReplacedString = placeholder.start - offset;
		
		offset += placeholder.end - placeholder.start;
	}
	
	let document = new Document(replacedString);
	
	for (let placeholder of placeholders) {
		let {lineIndex, offset} = document.cursorFromIndex(placeholder.indexInReplacedString);
		
		let cursor = c(
			baseLineIndex + lineIndex,
			lineIndex === 0 ? baseOffset + offset : offset,
		);
		
		placeholder.selection = s(cursor);
	}
	
	return {
		replacedString,
		placeholders,
	};
}
