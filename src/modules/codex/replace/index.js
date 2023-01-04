let mapArrayToObject = require("utils/mapArrayToObject");
let stringToLineTuples = require("modules/utils/stringToLineTuples");
let lineTuplesToStrings = require("modules/utils/lineTuplesToStrings");
let adjustIndent = require("modules/utils/adjustIndent");
let Selection = require("modules/Selection");
let Document = require("modules/Document");
let Node = require("modules/Tree/Node");
let getPlaceholders = require("modules/snippets/getPlaceholders");

let {s} = Selection;

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

function getRegexCaptures(result) {
	let captures = {};
	
	for (let {token, match} of result.matches) {
		if (token.type !== "regex") {
			continue;
		}
		
		let {capture} = token;
		
		if (capture) {
			captures[capture] = match;
		}
	}
	
	return captures;
}

function getQueryCaptures(result) {
	let captures = {};
	
	for (let {token, match} of result.matches) {
		if (token.type !== "query") {
			continue;
		}
		
		for (let [name, nodes] of Object.entries(match.captures)) {
			name = name.replace("-", "");
			
			captures[name] = s(nodes[0].start, nodes.at(-1).end);
		}
	}
	
	return captures;
}

function removeMinusPrefixedNodesFromCapturedNode(document, result, selection) {
	let copy = new Document(document.string);
	let editsApplied = [];
	
	for (let {token, match} of result.matches) {
		if (token.type !== "query") {
			continue;
		}
		
		for (let [name, nodes] of Object.entries(match.captures)) {
			if (!name.startsWith("-")) {
				continue;
			}
			
			let removeSelection = s(nodes[0].start, nodes.at(-1).end).adjust(editsApplied);
			
			if (!selection.contains(removeSelection)) {
				continue;
			}
			
			let edit = copy.edit(removeSelection, "");
			
			copy.apply(edit);
			
			editsApplied.push(removeSelection);
			
			selection = selection.edit(edit);
		}
	}
	
	return copy.getSelectedText(selection);
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
				let {placeholder} = part;
				let regexCaptures = getRegexCaptures(result);
				let queryCaptures = getQueryCaptures(result);
				
				/*
				regex captures are single-line so can be handled by standard
				snippet substitution, and can be @{...} expressions
				
				query captures can be multi-line so need to be formatted,
				and it doesn't make sense to use expressions as snippet
				expressions are designed to work on strings, e.g. quote() or
				.toUpperCase(). functions for node manipulation e.g.
				converting functions to arrow functions could be useful but
				aren't supported yet
				*/
				
				if (placeholder.name in regexCaptures) {
					line.string += placeholder.getValue(regexCaptures);
				} else if (placeholder.name in queryCaptures) {
					let selection = queryCaptures[placeholder.name];
					let {indentLevel} = document.lines[selection.start.lineIndex];
					let value = removeMinusPrefixedNodesFromCapturedNode(document, result, selection);
					let lineTuples = adjustIndent(stringToLineTuples(value), -indentLevel);
					
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
	}
	
	return replacedLines;
}

module.exports = function(code, results, replaceWith) {
	let original = new Document(code);
	let document = new Document(code);
	let lines = parseReplaceWith(replaceWith);
	let editsApplied = [];
	
	function getAdjustedSelection(selection) {
		return selection.adjust(editsApplied);
	}
	
	for (let result of results) {
		let replacedLines = getReplacedLines(document, lines, result, getAdjustedSelection);
		
		let str = lineTuplesToStrings(replacedLines.map(l => [l.indentLevel, l.string]), document.fileDetails.indentation.string, document.lines[result.replaceSelection.start.lineIndex].indentLevel, true);
		
		let edit = document.edit(result.selection, str.join(document.fileDetails.newline));
		
		document.apply(edit);
		
		editsApplied.push(edit);
	}
	
	return document.string;
}
