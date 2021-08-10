let createSpaces = require("./utils/createSpaces");
let findSiblingIndex = require("./utils/findSiblingIndex");
let countSpace = require("./utils/countSpace");

module.exports = function(document, selection) {
	let indentStr = document.fileDetails.indentation.string;
	let {startLineIndex, endLineIndex} = selection;
	let selectionHeaderLine = document.lines[startLineIndex];
	let prevSiblingIndex = findSiblingIndex(document.lines, startLineIndex - 1, selectionHeaderLine.indentLevel, -1);
	let nextSiblingIndex = findSiblingIndex(document.lines, endLineIndex, selectionHeaderLine.indentLevel, 1);
	let isFirstChild = prevSiblingIndex === null;
	let isLastChild = nextSiblingIndex === null;
	let spaceAbove = countSpace(document.lines, startLineIndex - 1, -1);
	let spaceBelow = countSpace(document.lines, endLineIndex, 1);
	let maxSpace = Math.max(spaceAbove, spaceBelow);
	let removeStart = startLineIndex - spaceAbove;
	let removeEnd = endLineIndex + spaceBelow;
	let insertBlank = prevSiblingIndex === null && nextSiblingIndex === null;
	let removeLinesCount = removeEnd - removeStart;
	let insertSpaces;
	
	if (isFirstChild) {
		insertSpaces = spaceAbove;
	} else if (isLastChild) {
		insertSpaces = spaceBelow;
	} else {
		insertSpaces = insertBlank ? 1 : maxSpace;
	}
	
	let spaces = createSpaces(insertSpaces, selectionHeaderLine.indentLevel, indentStr);
	
	return {
		lineIndex: removeStart,
		removeLinesCount,
		spaces,
		edit: document.lineEdit(removeStart, removeLinesCount, spaces),
	};
}
