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

function countSpace(lines, lineIndex, dir) {
	let space = 0;
	
	lineIndex += dir;
	
	let line;
	
	while (line = lines[lineIndex]) {
		if (line.trimmed.length === 0) {
			space++;
		} else {
			break;
		}
		
		lineIndex += dir;
	}
	
	return space;
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
				let prevSiblingIndex = findSiblingIndex(document.lines, fromStart - 1, selectionHeaderLine.indentLevel, -1);
				let nextSiblingIndex = findSiblingIndex(document.lines, fromEnd, selectionHeaderLine.indentLevel, 1);
				let spaceAbove = countSpace(document.lines, fromStart - 1, -1);
				let spaceBelow = countSpace(document.lines, fromEnd, 1);
				let maxSpace = Math.max(spaceAbove, spaceBelow);
				let removeStart = fromStart - spaceAbove;
				let removeEnd = fromEnd + spaceBelow;
				let insertBlank = prevSiblingIndex === null && nextSiblingIndex === null;
				let removeLines = removeEnd - removeStart;
				let insertSpaces = insertBlank ? 1 : maxSpace;
				let spaces = [];
				
				for (let i = 0; i < insertSpaces; i++) {
					spaces.push(indentStr.repeat(selectionHeaderLine.indentLevel));
				}
				
				let {
					removedLines,
					insertedLines,
				} = document.edit(
					removeStart,
					removeLines,
					spaces,
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
