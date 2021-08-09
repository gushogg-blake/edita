let createSpaces = require("./utils/createSpaces");
let findSiblingIndex = require("./utils/findSiblingIndex");
let countSpace = require("./utils/countSpace");

module.exports = function(document, selection) {
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
	let insertSpaces;
	
	if (isFirstChild) {
		insertSpaces = spaceAbove;
	} else if (isLastChild) {
		insertSpaces = spaceBelow;
	} else {
		insertSpaces = insertBlank ? 1 : maxSpace;
	}
	
	let spaces = createSpaces(insertSpaces, selectionHeaderLine.indentLevel, indentStr);
	
	return document.lineEdit(
		removeStart,
		removeLines,
		spaces,
	);
}
