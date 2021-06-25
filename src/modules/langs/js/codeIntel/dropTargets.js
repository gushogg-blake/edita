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

function removeSelection(document, selection) {
	let indentStr = document.fileDetails.indentation.string;
	let [start, end] = selection;
	let selectionHeaderLine = document.lines[start];
	let prevSiblingIndex = findSiblingIndex(document.lines, start - 1, selectionHeaderLine.indentLevel, -1);
	let nextSiblingIndex = findSiblingIndex(document.lines, end, selectionHeaderLine.indentLevel, 1);
	let isFirstChild = prevSiblingIndex === null;
	let isLastChild = nextSiblingIndex === null;
	let spaceAbove = countSpace(document.lines, start - 1, -1);
	let spaceBelow = countSpace(document.lines, end, 1);
	let maxSpace = Math.max(spaceAbove, spaceBelow);
	let removeStart = start - spaceAbove;
	let removeEnd = end + spaceBelow;
	let insertBlank = prevSiblingIndex === null && nextSiblingIndex === null;
	let removeLines = removeEnd - removeStart;
	let spaces = [];
	
	let insertSpaces;
	
	if (isFirstChild) {
		insertSpaces = spaceAbove;
	} else if (isLastChild) {
		insertSpaces = spaceBelow;
	} else {
		insertSpaces = insertBlank ? 1 : maxSpace;
	}
	
	for (let i = 0; i < insertSpaces; i++) {
		spaces.push(indentStr.repeat(selectionHeaderLine.indentLevel));
	}
	
	return document.edit(
		removeStart,
		removeLines,
		spaces,
	);
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
			let edits = [];
			let indentStr = document.fileDetails.indentation.string;
			let [toStart, toEnd] = toSelection;
			
			if (move && fromSelection) {
				let [fromStart, fromEnd] = fromSelection;
				
				let edit = removeSelection(document, fromSelection);
				
				edits.push(edit);
				
				if (fromEnd < toEnd) {
					let {
						removedLines,
						insertedLines,
					} = edit;
					
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
			
			edits.push(document.edit(insertIndex, removeLines, insertLines));
			
			let newStartLineIndex = footerLineIndex + 1;
			
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
