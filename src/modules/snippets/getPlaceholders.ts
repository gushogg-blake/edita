import parseJavaScript from "./parseJavaScript";
import createExpressionFunction from "./createExpressionFunction";
import Tabstop from "./Tabstop";
import Expression from "./Expression";
import RegexReference from "./RegexReference";
import AtLiteral from "./AtLiteral";
import EndMarker from "./EndMarker";

export default function(string, createTabstops=true) {
	let placeholders = [];
	let encounteredTabstops = {};
	
	let i = 0;
	
	while (i < string.length) {
		let ch = string[i];
		let next = string[i + 1];
		
		if (ch === "@" && next) {
			if (next === "{") {
				let nameWithDefault = string.substr(i + "@{".length).match(/^([$\w_]+)(?=:)/);
				
				if (nameWithDefault) {
					// @{name:defaultExpression}
					
					let [, name] = nameWithDefault;
					let start = i;
					let expressionStart = start + "@{".length + name.length + ":".length;
					let expressionEnd = parseJavaScript(string, expressionStart);
					let expression = string.substring(expressionStart, expressionEnd);
					let fn = createExpressionFunction(expression);
					let end = Math.min(string.length, expressionEnd + "}".length);
					
					placeholders.push(new Tabstop(start, end, name, fn));
					
					i = end;
				} else {
					// @{expression}
					
					let start = i;
					let expressionStart = start + "@{".length;
					let expressionEnd = parseJavaScript(string, expressionStart);
					let expression = string.substring(expressionStart, expressionEnd);
					let fn = createExpressionFunction(expression);
					let end = Math.min(string.length, expressionEnd + "}".length);
					
					placeholders.push(new Expression(start, end, fn));
					
					i = end;
				}
			} else if (next.match(/[$\w_]/)) {
				// @name
				
				let [, name] = string.substr(i + "@".length).match(/^([$\w_]+)/);
				let start = i;
				let end = start + "@".length + name.length;
				
				if (encounteredTabstops[name] || !createTabstops) {
					// convert subsequent @name tabstops to expressions
					
					let fn = createExpressionFunction(getVariableName(name));
					
					placeholders.push(new Expression(start, end, fn, name));
				} else {
					placeholders.push(new Tabstop(start, end, name, null));
					
					encounteredTabstops[name] = true;
				}
				
				i = end;
			} else if (next.match(/\d/)) {
				// @N for regex replace
				
				let [, index] = string.substr(i + "@".length).match(/^(\d+)/);
				let start = i;
				let end = start + "@".length + index.length;
				
				placeholders.push(new RegexReference(start, end, index));
				
				i = end;
			} else if (next === "@") {
				let start = i;
				let end = i + 2;
				
				placeholders.push(new AtLiteral(start, end));
				
				i = end;
			} else {
				i += 2;
				
				continue;
			}
		} else {
			i++;
		}
	}
	
	placeholders.push(new EndMarker(string.length));
	
	return placeholders;
}
