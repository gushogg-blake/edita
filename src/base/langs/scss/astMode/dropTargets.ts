import {indentLines} from "modules/utils/editing";
import AstSelection, {a} from "modules/core/AstSelection";
import removeSelection from "modules/astCommon/removeSelection";

export default {
	addSelectionToNewRule: {
		type: "addSelectionToNewRule",
		label: "New rule",
		
		isAvailable(document, lineIndex) {
			return document.lines[lineIndex].isBlank;
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
			
			let toLineIndex = toEnd - 1;
			let targetLine = document.lines[toLineIndex];
			
			let insertIndex = toLineIndex - removeDiff;
			let removeLines = 1;
			
			let insertLines = indentLines([
				"",
				"@selector {",
				...indentLines(lines.map(function([indentLevel, line], i) {
					return indentStr.repeat(indentLevel) + line + (i === lines.length - 1 ? "@$" : "");
				}), indentStr),
				"}",
				"",
			], indentStr, targetLine.indentLevel);
			
			let newStartLineIndex = toLineIndex + 1 - removeDiff;
			
			return {
				edits,
				
				snippetEdit: {
					insertIndex,
					removeLines,
					insertLines,
				},
				
				newSelection: a(newStartLineIndex, newStartLineIndex + lines.length),
			};
		},
	},
};
