let indentLines = require("../../../utils/indentLines");
let AstSelection = require("../../../utils/AstSelection");
let removeSelection = require("../../common/astMode/removeSelection");

let {s} = AstSelection;

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
			let {startLineIndex: toStart, endLineIndex: toEnd} = toSelection;
			let removeDiff = 0;
			
			if (move && fromSelection) {
				let {startLineIndex: fromStart, endLineIndex: fromEnd} = fromSelection;
				
				let {
					removeLinesCount,
					spaces,
					edit,
				} = removeSelection(document, fromSelection);
				
				edits.push(edit);
				
				if (fromEnd < toEnd) {
					removeDiff = removeLinesCount - spaces.length;
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
				newSelection: s(newStartLineIndex, newStartLineIndex + lines.length),
			};
		},
	},
	
	addSelectionToNewElseIf: {
		type: "addSelectionToNewElseIf",
		label: "+ else if",
	},
};