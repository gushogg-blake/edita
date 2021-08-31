let AstSelection = require("modules/utils/AstSelection");
let removeSelection = require("../../common/astMode/removeSelection");
let createSpaces = require("../../common/astMode/utils/createSpaces");
let findIndentLevel = require("../../common/astMode/utils/findIndentLevel");
let findSiblingIndex = require("../../common/astMode/utils/findSiblingIndex");
let dropTargets = require("./dropTargets");

let {s} = AstSelection;

module.exports = function(
	document,
	fromSelection,
	toSelection,
	selectionLines,
	move,
	option,
	target,
) {
	if (target) {
		return dropTargets[target].handleDrop(
			document,
			fromSelection,
			toSelection,
			selectionLines,
			move,
			option,
		);
	}
	
	let fromStart;
	let fromEnd;
	let toStart;
	let toEnd;
	let edits = [];
	let newSelection;
	let indentStr = document.fileDetails.indentation.string;
	
	if (fromSelection) {
		({startLineIndex: fromStart, endLineIndex: fromEnd} = fromSelection);
	}
	
	if (toSelection) {
		({startLineIndex: toStart, endLineIndex: toEnd} = toSelection);
	}
	
	if (
		fromSelection
		&& toSelection
		&& AstSelection.isAdjacent(fromSelection, toSelection)
	) { // space from sibling
		// might be better to do nothing here, as this action (space the
		// selection from its sibling) is only available nodes that are
		// already spaced on the other side (because there has to be a space
		// to drag it into)
		
		let indentLevel = document.lines[fromStart].indentLevel;
		let dir = fromStart < toStart ? -1 : 1;
		let index = fromStart < toStart ? fromStart - 1 : fromEnd;
		let addSpacesAt = fromStart < toStart ? fromStart : fromEnd;
		let siblingIndex = findSiblingIndex(document.lines, index, indentLevel, dir);
		
		if (siblingIndex !== null) {
			let existingSpaces = Math.abs(index - siblingIndex);
			let spaces = (toEnd - toStart) - existingSpaces;
			let adjustSelection = fromStart < toStart ? spaces : 0;
			
			edits.push(document.lineEdit(addSpacesAt, 0, createSpaces(spaces, indentLevel, indentStr)));
			
			newSelection = s(fromStart + adjustSelection, fromEnd + adjustSelection);
		}
	} else {
		let removeDiff = 0;
		
		if (move && fromSelection) {
			let {
				removeLinesCount,
				spaces,
				edit,
			} = removeSelection(document, fromSelection);
			
			edits.push(edit);
			
			if (toSelection && fromEnd < toEnd) {
				removeDiff = removeLinesCount - spaces.length;
			}
			
			// TODO newSelection
		}
		
		if (toSelection) {
			let insertIndentLevel = findIndentLevel(document.lines, toStart);
			let lines = AstSelection.selectionLinesToStrings(selectionLines, indentStr, insertIndentLevel);
			
			if (toStart === toEnd) {
				/*
				insert between lines - only add a space if the selection
				indicates it, e.g. it is a block and prefs are set to space
				blocks from other lines
				*/
				
				let edit = document.lineEdit(toStart - removeDiff, 0, lines);
				
				edits.push(edit);
				
				let newSelectionStart = toStart - removeDiff;
				
				newSelection = s(newSelectionStart, newSelectionStart + lines.length);
			} else {
				/*
				insert into space - insert after the space and copy the space
				below the insertion
				*/
				
				let spaces = createSpaces(toEnd - toStart, insertIndentLevel, indentStr);
				
				let edit = document.lineEdit(toEnd - removeDiff, 0, [
					...lines,
					...spaces,
				]);
				
				edits.push(edit);
				
				let newSelectionStart = toEnd - removeDiff;
				
				newSelection = s(newSelectionStart, newSelectionStart + lines.length);
			}
		}
	}
	
	return {
		edits,
		newSelection,
	};
}
