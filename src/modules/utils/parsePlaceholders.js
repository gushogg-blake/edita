let parseJavaScript = require("modules/utils/parseJavaScript");
let Document = require("modules/Document");

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
					let expressionEnd = parseJavaScript(string, expressionStart);
					let expression = string.substring(expressionStart, expressionEnd);
					let end = Math.min(string.length, expressionEnd + "}".length);
					
					placeholders.push({
						type: "tabstop",
						start,
						end,
						name,
						defaultExpression: expression,
					});
					
					i = end;
				} else {
					// @{expression}
					
					let start = i;
					let expressionStart = start + "@{".length;
					let expressionEnd = parseJavaScript(string, expressionStart);
					let expression = string.substring(expressionStart, expressionEnd);
					let end = Math.min(string.length, expressionEnd + "}".length);
					
					placeholders.push({
						type: "expression",
						start,
						end,
						expression,
					});
					
					i = end;
				}
			} else if (next.match(/[$\w]/)) {
				// @name
				
				let [, name] = string.substr(i + "@".length).match(/^([$\w]+)/);
				let start = i;
				let end = start + "@".length + name.length;
				
				placeholders.push({
					type: "tabstop",
					start,
					end,
					name,
					defaultExpression: null,
				});
				
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

module.exports = function(string) {
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
		placeholder.cursor = document.cursorFromIndex(placeholder.indexInReplacedString);
	}
	
	console.log(replacedString);
	
	console.log(placeholders);
	
	return {
		string: replacedString,
		placeholders: [], //
	};
}
