let mapArrayToObject = require("utils/mapArrayToObject");
let stringToLineTuples = require("modules/utils/stringToLineTuples");
let lineTuplesToStrings = require("modules/utils/lineTuplesToStrings");
let adjustIndent = require("modules/utils/adjustIndent");
let Document = require("modules/Document");
let Node = require("modules/Tree/Node");
//let createPositions = require("modules/snippets/createPositions");
let getPlaceholders = require("modules/snippets/getPlaceholders");

function getLineParts(string) {
	let parts = [];
	let placeholders = getPlaceholders(string, false).filter(p => p.type === "expression");
	
	if (placeholders[0]?.start > 0 || placeholders.length === 0) {
		parts.push({
			type: "literal",
			string: string.substr(0, placeholders[0]?.start || string.length),
		});
	}
	
	for (let i = 0; i < placeholders.length; i++) {
		let placeholder = placeholders[i];
		let next = placeholders[i + 1];
		
		parts.push({
			type: "placeholder",
			placeholder,
		});
		
		if (placeholder.end < string.length && (!next || placeholder.end < next.start)) {
			parts.push({
				type: "literal",
				string: string.substring(placeholder.end, next?.start || string.length),
			});
		}
	}
	
	return parts;
}

/*
convert the replacement string to an array of lines as
{indentLevel, parts} objects, where each line part is either a
literal or an expression placeholder
*/

function parseReplaceWith(replaceWith) {
	let lineTuples = stringToLineTuples(replaceWith);
	
	let lines = lineTuples.map(function([indentLevel, string]) {
		return {
			indentLevel,
			parts: getLineParts(string),
		};
	});
	
	return lines;
}

/*
get placeholder values from result
*/

function getContext(result) {
	let context = {};
	
	for (let {token, match} of result.matches) {
		let {type} = token;
		
		if (type === "query") {
			let {captures} = match;
			
			for (let [name, nodes] of Object.entries(captures)) {
				name = name.replace("-", "");
				
				context[name] = nodes[0];
			}
		} else if (type === "regex") {
			let {capture} = token;
			
			if (capture) {
				context[capture] = match;
			}
		}
	}
	
	return context;
}

/*
convert {indentLevel, parts} lines into lines with placeholders
filled in

this can result in more lines if placeholders are multiline

the lines will still have normalised indents (starting from 0 as opposed
to the indent level in the original document)

multiline placeholders will be properly indented
*/

function getReplacedLines(document, lines, result) {
	let replacedLines = [];
	
	console.log(lines);
	
	for (let {indentLevel, parts} of lines) {
		let line = {
			indentLevel,
			string: "",
		};
		
		replacedLines.push(line);
		
		for (let part of parts) {
			if (part.type === "literal") {
				line.string += part.string;
			} else {
				let context = getContext(result);
				let value = part.placeholder.getValue(context);
				
				if (value instanceof Node) {
					value = value.text;
				}
				
				let lineTuples = adjustIndent(stringToLineTuples(value), -document.lines[result.replaceSelection.start.lineIndex].indentLevel);
				
				line.string += lineTuples[0][1];
				
				for (let [indentLevel, string] of lineTuples.slice(1)) {
					replacedLines.push({
						indentLevel: line.indentLevel + indentLevel,
						string,
					});
				}
				
				line = replacedLines.at(-1);
			}
		}
	}
	
	return replacedLines;
}

module.exports = function(code, results, replaceWith) {
	let document = new Document(code);
	let lines = parseReplaceWith(replaceWith);
	
	for (let result of results) {
		let replacedLines = getReplacedLines(document, lines, result);
		
		let str = lineTuplesToStrings(replacedLines.map(l => [l.indentLevel, l.string]), document.fileDetails.indentation.string, document.lines[result.replaceSelection.start.lineIndex].indentLevel, true);
		
		document.apply(document.edit(result.selection, str.join(document.fileDetails.newline)));
	}
	
	return document.string;
}
