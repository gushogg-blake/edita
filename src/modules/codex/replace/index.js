let mapArrayToObject = require("utils/mapArrayToObject");
let stringToLineTuples = require("modules/utils/stringToLineTuples");
let Document = require("modules/Document");
//let createPositions = require("modules/snippets/createPositions");
let getPlaceholders = require("modules/snippets/getPlaceholders");

function getLineParts(string) {
	let parts = [];
	let placeholders = getPlaceholders(string, false).filter(p => p.type === "expression");
	
	if (placeholders[0]?.start > 0) {
		parts.push({
			type: "literal",
			string: string.substr(0, placeholders[0].start),
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
convert {indentLevel, parts} lines into line tuples with placeholders
filled in

this can result in more lines if placeholders are multiline

the lines will still have normalised indents (starting from 0 as opposed
to the indent level in the original document)

multiline placeholders will be properly indented
*/

function getReplacedLines(lines, result) {
	let lineTuples = [];
	
	for (let {indentLevel, parts} of lines) {
		
	}
}

module.exports = function(code, results, replaceWith) {
	let document = new Document(code);
	let lines = parseReplaceWith(replaceWith);
	
	for (let result of results) {
		let replacedLines = getReplacedLines(lines, result);
		
		document.apply(document.edit(result.selection, replaceWith));
	}
	
	return document.string;
}
