let indentLines = require("modules/utils/indentLines");
let AstSelection = require("modules/AstSelection");
let removeSelection = require("modules/astCommon/removeSelection");
let isIfFooter = require("./utils/isIfFooter");

let {s} = AstSelection;

module.exports = {
	addSelectionToNewElse: {
		type: "addSelectionToNewElse",
		label: "+ else",
		
		isAvailable(document, lineIndex) {
			return isIfFooter(document, lineIndex);
		},
		
		handleDrop(
			document,
			fromSelection,
			toSelection,
			lines,
			move,
			option,
		) {
			let edits = [];
			let indentStr = document.format.indentation.string;
			let {startLineIndex: toStart, endLineIndex: toEnd} = toSelection;
			let removeDiff = 0;
			
			if (move && fromSelection) {
				let {startLineIndex: fromStart, endLineIndex: fromEnd} = fromSelection;
				
				let edit = removeSelection(document, fromSelection);
				
				edits.push(edit);
				
				if (fromEnd < toEnd) {
					removeDiff = edit.removeLinesCount - edit.insertLines.length;
				}
			}
			
			let footerLineIndex = toEnd - 1;
			let footerLine = document.lines[footerLineIndex];
			
			let insertIndex = footerLineIndex - removeDiff;
			let removeLines = 1;
			
			let insertLines = indentLines([
				"} else {",
				...indentLines(lines.map(function([indentLevel, line]) {
					return indentStr.repeat(indentLevel) + line;
				}), indentStr),
				"}",
			], indentStr, footerLine.indentLevel);
			
			edits.push({
				lineIndex: insertIndex,
				removeLinesCount: removeLines,
				insertLines,
			});
			
			let newStartLineIndex = footerLineIndex + 1 - removeDiff;
			
			return {
				edits,
				newSelection: s(newStartLineIndex, newStartLineIndex + lines.length),
			};
		},
	},
	
	addSelectionToNewElseIf: {
		type: "addSelectionToNewElseIf",
		label: "+ else if",
		
		isAvailable(document, lineIndex) {
			return isIfFooter(document, lineIndex);
		},
		
		handleDrop(
			document,
			fromSelection,
			toSelection,
			lines,
			move,
			option,
		) {
			let edits = [];
			let indentStr = document.format.indentation.string;
			let {startLineIndex: toStart, endLineIndex: toEnd} = toSelection;
			let removeDiff = 0;
			let remove;
			let insert;
			
			if (move && fromSelection) {
				let {startLineIndex: fromStart, endLineIndex: fromEnd} = fromSelection;
				
				let edit = removeSelection(document, fromSelection);
				
				edits.push(edit);
				
				if (fromEnd < toEnd) {
					removeDiff = edit.removeLinesCount - edit.insertLines.length;
				}
			}
			
			let footerLineIndex = toEnd - 1;
			let footerLine = document.lines[footerLineIndex];
			
			let insertIndex = footerLineIndex - removeDiff;
			let removeLines = 1;
			
			let insertLines = indentLines([
				"} else if (@condition) {",
				...indentLines(lines.map(function([indentLevel, line], i) {
					return indentStr.repeat(indentLevel) + line + (i === lines.length - 1 ? "@$" : "");
				}), indentStr),
				"}",
			], indentStr, footerLine.indentLevel);
			
			let newStartLineIndex = footerLineIndex + 1 - removeDiff;
			
			return {
				edits,
				
				snippetEdit: {
					insertIndex,
					removeLines,
					insertLines,
				},
				
				newSelection: s(newStartLineIndex, newStartLineIndex + lines.length),
			};
		},
	},
};
