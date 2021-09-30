let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");
let Document = require("modules/Document");
let parseJavaScript = require("./parseJavaScript");
let createExpressionFunction = require("./createExpressionFunction");
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
					let fn = createExpressionFunction(expression, dollarVariables);
					let end = Math.min(string.length, expressionEnd + "}".length);
					
					placeholders.push(new Tabstop(start, end, name, fn));
					
					i = end;
				} else {
					// @{expression}
					
					let start = i;
					let expressionStart = start + "@{".length;
					let {index: expressionEnd, dollarVariables} = parseJavaScript(string, expressionStart);
					let expression = string.substring(expressionStart, expressionEnd);
					let fn = createExpressionFunction(expression, dollarVariables);
					let end = Math.min(string.length, expressionEnd + "}".length);
					
					placeholders.push(new Expression(start, end, fn));
					
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

function getReplacedString(string, placeholders) {
	let replacedString = "";
	let prevPlaceholderEnd = 0;
	
	for (let placeholder of placeholders) {
		replacedString += string.substring(prevPlaceholderEnd, placeholder.start);
		
		prevPlaceholderEnd = placeholder.end;
	}
	
	replacedString += string.substr(prevPlaceholderEnd);
	
	return replacedString;
}

module.exports = function(string, baseLineIndex=0, baseOffset=0) {
	let placeholders = getPlaceholders(string);
	let replacedString = getReplacedString(string, placeholders);
	
	let offset = 0;
	let document = new Document(replacedString);
	
	let positions = placeholders.map(function(placeholder) {
		let indexInReplacedString = placeholder.start - offset;
		let {lineIndex, offset} = document.cursorFromIndex(indexInReplacedString);
		
		let cursor = c(
			baseLineIndex + lineIndex,
			lineIndex === 0 ? baseOffset + offset : offset,
		);
		
		return {
			placeholder,
			selection: s(cursor),
			value: "",
		};
		
		offset += placeholder.end - placeholder.start;
	});
	
	return {
		replacedString,
		positions,
	};
}
