let mapArrayToObject = require("utils/mapArrayToObject");
let Selection = require("modules/Selection");
let Cursor = require("modules/Cursor");
let AstSelection = require("modules/AstSelection");
let Document = require("modules/Document");
let SelectionContents = require("modules/SelectionContents");
let astCommon = require("modules/astCommon");
let Node = require("modules/Tree/Node");
let getPlaceholders = require("modules/snippets/getPlaceholders");

let {s} = Selection;
let {c} = Cursor;
let {s: a} = AstSelection;

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
	let selectionContents = SelectionContents.fromString(replaceWith);
	
	let lines = selectionContents.lines.map(function({indentLevel, string}) {
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

function expandRemoveSelectionToTrimBlankLines(document, selection) {
	let {start, end} = selection;
	let startLine = document.lines[start.lineIndex];
	let endLine = document.lines[end.lineIndex];
	
	if (start.offset > startLine.indentOffset || end.offset !== endLine.string.length) {
		return document.edit(selection, "");
	} else {
		let astSelection = a(start.lineIndex, end.lineIndex + 1);
		let {lineIndex, removeLinesCount, insertLines} = astCommon.removeSelection(document, astSelection);
		
		return document.lineEdit(lineIndex, removeLinesCount, insertLines);
	}
}

/*
for each captured node we want the text of, we go through all @- prefixed nodes
in the result and if they're inside the captured node, remove them.

removing all the @- prefixed nodes in a single pass is not possible as we still
want to be able to use them in the replacement, so they have to be accessible
somehow but without any other deleted nodes inside them.
*/

function capturedNodeSelectionContentsWithoutDeletedNodes(document, result, captureName, selection) {
	let copy = new Document(document.string);
	let editsApplied = [];
	
	for (let {token, match} of result.matches) {
		if (token.type !== "query") {
			continue;
		}
		
		for (let [name, nodes] of Object.entries(match.captures)) {
			if (!name.startsWith("-") || name.replace("-", "") === captureName) {
				continue;
			}
			
			let removeSelection = s(nodes[0].start, nodes.at(-1).end).adjust(editsApplied);
			
			if (!selection.contains(removeSelection)) {
				continue;
			}
			
			let edit = expandRemoveSelectionToTrimBlankLines(copy, removeSelection);
			
			copy.apply(edit);
			
			editsApplied.push(edit);
			
			selection = selection.edit(edit);
		}
	}
	
	return SelectionContents.fromSelection(copy, selection);
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
					let value = capturedNodeSelectionContentsWithoutDeletedNodes(document, result, placeholder.name, selection);
					
					line.string += value.lines[0].string;
					
					for (let {indentLevel, string} of value.lines.slice(1)) {
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
	
	for (let i = results.length - 1; i >= 0; i--) {
		let result = results[i];
		let {indentLevel} = document.lines[result.replaceSelection.start.lineIndex];
		let replacedLines = getReplacedLines(document, lines, result);
		let selectionContents = new SelectionContents(replacedLines);
		let string = selectionContents.getString(document, indentLevel, true);
		
		let edit = document.edit(result.selection, string);
		
		document.apply(edit);
	}
	
	return document.string;
}
