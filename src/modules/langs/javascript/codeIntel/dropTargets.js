let indentLines = require("../../../utils/indentLines");
let AstSelection = require("../../../utils/AstSelection");
let removeSelection = require("../../common/codeIntel/removeSelection");

module.exports = {
	addSelectionToNewElse: {
		type: "addSelectionToNewElse",
		label: "+ else",
		
		handleDrop(
			document,
			fromSelection,
			toSelection,
			lines,
			move,
			option,
		) {
			let edits = [];
			let indentStr = document.fileDetails.indentation.string;
			let [toStart, toEnd] = toSelection;
			let removeDiff = 0;
			
			if (move && fromSelection) {
				let [fromStart, fromEnd] = fromSelection;
				
				let edit = removeSelection(document, fromSelection);
				
				edits.push(edit);
				
				if (fromEnd < toEnd) {
					removeDiff = edit.removeLines.length - edit.insertLines.length;
				}
			}
			
			let footerLineIndex = toEnd - 1;
			let footerLine = document.lines[footerLineIndex];
			
			let insertIndex = footerLineIndex;
			let removeLines = 1;
			
			let insertLines = indentLines([
				"} else {",
				...indentLines(lines.map(function([indentLevel, line]) {
					return indentStr.repeat(indentLevel) + line;
				}), indentStr),
				"}",
			], indentStr, footerLine.indentLevel);
			
			edits.push(document.lineEdit(insertIndex, removeLines, insertLines));
			
			let newStartLineIndex = footerLineIndex + 1 - removeDiff;
			
			return {
				edits,
				newSelection: AstSelection.s(newStartLineIndex, newStartLineIndex + lines.length),
			};
		},
	},
	
	addSelectionToNewElseIf: {
		type: "addSelectionToNewElseIf",
		label: "+ else if",
	},
};
