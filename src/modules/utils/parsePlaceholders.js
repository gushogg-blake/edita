let parseJavaScript = require("modules/utils/parseJavaScript");

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
						type: "placeholder",
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
					type: "placeholder",
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
	
	console.log(placeholders);
	
	return {
		string,
		placeholders: [], //
	};
}
