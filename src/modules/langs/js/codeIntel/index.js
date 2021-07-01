let indentLines = require("../../../utils/indentLines");
let AstSelection = require("../../../utils/AstSelection");
let removeSelection = require("../../common/codeIntel/removeSelection");
let createSpaces = require("../../common/codeIntel/utils/createSpaces");
let findIndentLevel = require("../../common/codeIntel/utils/findIndentLevel");
let findSiblingIndex = require("../../common/codeIntel/utils/findSiblingIndex");
let getOpenersAndClosersOnLine = require("./getOpenersAndClosersOnLine");
let astSelection = require("./astSelection");
let pickOptions = require("./pickOptions");
let dropTargets = require("./dropTargets");
let generatePickOptions = require("./generatePickOptions");
let generateDropTargets = require("./generateDropTargets");

module.exports = {
	pickOptions,
	dropTargets,
	getOpenersAndClosersOnLine,
	astSelection,
	generatePickOptions,
	generateDropTargets,
	
	drop(
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
			([fromStart, fromEnd] = fromSelection);
		}
		
		if (toSelection) {
			([toStart, toEnd] = toSelection);
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
				
				edits.push(document.edit(addSpacesAt, 0, createSpaces(spaces, indentLevel, indentStr)));
				
				newSelection = AstSelection.s(fromStart + adjustSelection, fromEnd + adjustSelection);
			}
		} else {
			if (move && fromSelection) {
				let edit = removeSelection(document, fromSelection);
				
				edits.push(edit);
				
				if (toSelection && fromEnd < toEnd) {
					let {
						removeLines,
						insertLines,
					} = edit;
					
					let removeDiff = removeLines.length - insertLines.length;
					
					toStart -= removeDiff;
					toEnd -= removeDiff;
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
					
					let edit = document.edit(toStart, 0, lines);
					
					edits.push(edit);
					
					newSelection = AstSelection.s(toStart, toStart + lines.length);
				} else {
					/*
					insert into space - insert after the space and copy the space
					below the insertion
					*/
					
					let spaces = createSpaces(toEnd - toStart, insertIndentLevel, indentStr);
					
					let edit = document.edit(toEnd, 0, [
						...lines,
						...spaces,
					]);
					
					edits.push(edit);
					
					newSelection = AstSelection.s(toEnd, toEnd + lines.length);
				}
			}
		}
		
		return {
			edits,
			newSelection,
		};
	},
};
