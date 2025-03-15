let AstSelection = require("modules/AstSelection");
let removeSelection = require("./removeSelection");
let {createSpaces, findIndentLevel, findSiblingIndex} = require("./utils");

let {s} = AstSelection;

export default function(
	astMode,
	document,
	fromSelection,
	toSelection,
	selectionLines,
	move,
	pickOptionType,
	dropTargetType,
) {
	if (dropTargetType) {
		return astMode.dropTargets[dropTargetType].handleDrop(
			document,
			fromSelection,
			toSelection,
			selectionLines,
			move,
			pickOptionType,
		);
	}
	
	let fromStart;
	let fromEnd;
	let toStart;
	let toEnd;
	let edits = [];
	let newSelection;
	let indentStr = document.format.indentation.string;
	
	if (fromSelection) {
		({startLineIndex: fromStart, endLineIndex: fromEnd} = fromSelection);
	}
	
	if (toSelection) {
		({startLineIndex: toStart, endLineIndex: toEnd} = toSelection);
	}
	
	if (
		fromSelection
		&& toSelection
		&& fromSelection.isNextTo(toSelection)
	) { // space from sibling
		// might be better to do nothing here, as this action (space the
		// selection from its sibling) is only available to nodes that are
		// already spaced on the other side (because there has to be a space
		// to drag it into)
		
		let indentLevel = document.lines[fromStart].indentLevel;
		let dir = fromStart < toStart ? -1 : 1;
		let index = fromStart < toStart ? fromStart - 1 : fromEnd;
		let addSpacesAt = fromStart < toStart ? fromStart : fromEnd;
		let siblingIndex = findSiblingIndex(document, index, indentLevel, dir);
		
		if (siblingIndex !== null) {
			let existingSpaces = Math.abs(index - siblingIndex);
			let spaces = (toEnd - toStart) - existingSpaces;
			let adjustSelection = fromStart < toStart ? spaces : 0;
			
			edits.push({
				lineIndex: addSpacesAt,
				removeLinesCount: 0,
				insertLines: createSpaces(spaces, indentLevel, indentStr),
			});
			
			newSelection = s(fromStart + adjustSelection, fromEnd + adjustSelection);
		}
	} else {
		let removeDiff = 0;
		
		if (move && fromSelection) {
			let edit = removeSelection(document, fromSelection);
			
			edits.push(edit);
			
			if (toSelection && fromEnd < toEnd) {
				removeDiff = edit.removeLinesCount - edit.insertLines.length;
			}
			
			// TODO newSelection
		}
		
		if (toSelection) {
			let insertIndentLevel = findIndentLevel(document, toStart);
			let lines = AstSelection.selectionLinesToStrings(selectionLines, indentStr, insertIndentLevel);
			
			if (toStart !== toEnd) {
				/*
				insert into space - copy the space each side by default if there's a
				sibling on that side
				*/
				
				let spaceAbove = toStart > 0 && document.lines[toStart - 1].indentLevel === insertIndentLevel;
				let spaceBelow = toEnd < document.lines.length && document.lines[toEnd].indentLevel === insertIndentLevel;
				
				let spaces = createSpaces(toEnd - toStart, insertIndentLevel, indentStr);
				
				if (spaceAbove) {
					lines = [...spaces, ...lines];
				}
				
				if (spaceBelow) {
					lines = [...lines, ...spaces];
				}
			}
			
			let adjustSpaces = {
				above: 0,
				below: 0,
			};
			
			if (fromSelection && astMode.adjustSpaces && toStart === toEnd) {
				adjustSpaces = astMode.adjustSpaces(document, fromSelection, toSelection, selectionLines, lines, insertIndentLevel);
			}
			
			if (adjustSpaces.above < 0) {
				lines = lines.slice(-adjustSpaces.above);
			}
			
			if (adjustSpaces.below < 0) {
				lines = lines.slice(0, lines.length - -adjustSpaces.below);
			}
			
			let edit = {
				lineIndex: toStart - removeDiff,
				removeLinesCount: toEnd - toStart,
				
				insertLines: [
					...createSpaces(Math.max(0, adjustSpaces.above), insertIndentLevel, indentStr),
					...lines,
					...createSpaces(Math.max(0, adjustSpaces.below), insertIndentLevel, indentStr),
				],
			};
			
			edits.push(edit);
			
			let newSelectionStart = toStart - removeDiff + adjustSpaces.above;
			
			newSelection = s(newSelectionStart, newSelectionStart + lines.length);
		}
	}
	
	return {
		edits,
		newSelection,
	};
}
