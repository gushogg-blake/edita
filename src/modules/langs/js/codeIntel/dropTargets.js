let indentLines = require("../../../utils/indentLines");
let AstSelection = require("../../../utils/AstSelection");

let handleDrop = {
	addSelectionToNewElse(
		document,
		fromSelection,
		toSelection,
		lines,
		option,
	) {
		
	},
};

function findSiblingIndex(lines, lineIndex, indentLevel, dir) {
	let line;
	
	while (line = lines[lineIndex]) {
		if (line.indentLevel < indentLevel) {
			return null;
		}
		
		if (line.indentLevel === indentLevel && line.trimmed.length > 0) {
			return lineIndex;
		}
		
		lineIndex += dir;
	}
	
	return null;
}

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
			let indentStr = document.fileDetails.indentation.string;
			let [toStart, toEnd] = toSelection;
			
			if (move && fromSelection) {
				let [fromStart, fromEnd] = fromSelection;
				let selectionHeaderLine = document.lines[fromStart];
				let nextSiblingIndex = findSiblingIndex(document.lines, fromEnd, selectionHeaderLine.indentLevel, 1);
				let prevSiblingIndex = findSiblingIndex(document.lines, fromStart - 1, selectionHeaderLine.indentLevel, -1);
				let removeStart = fromStart;
				let removeEnd = fromEnd;
				let insertBlank = false;
				
				if (nextSiblingIndex !== null) {
					removeEnd = nextSiblingIndex;
				} else if (prevSiblingIndex !== null) {
					removeStart = prevSiblingIndex + 1;
				} else {
					insertBlank = true;
				}
				
				let removeLines = removeEnd - removeStart;
				
				let {
					removedLines,
					insertedLines,
				} = document.edit(
					removeStart,
					removeLines,
					insertBlank ? indentStr.repeat(selectionHeaderLine.indentLevel) : null,
				);
				
				if (fromEnd < toStart) {
					let removeDiff = removedLines.length - insertedLines.length;
					
					toStart -= removeDiff;
					toEnd -= removeDiff;
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
			
			document.edit(insertIndex, removeLines, insertLines);
			
			let newStartLineIndex = footerLineIndex + 1;
			
			console.log(AstSelection.s(newStartLineIndex, newStartLineIndex + lines.length));
			
			return AstSelection.s(newStartLineIndex, newStartLineIndex + lines.length);
		},
	},
	
	addSelectionToNewElseIf: {
		type: "addSelectionToNewElseIf",
		label: "+ else if",
	},
};
