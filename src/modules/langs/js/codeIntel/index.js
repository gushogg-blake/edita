let indentLines = require("../../../utils/indentLines");
let AstSelection = require("../../../utils/AstSelection");
let removeSelection = require("../../common/codeIntel/removeSelection");
let createSpaces = require("../../common/codeIntel/utils/createSpaces");
let findIndentLevel = require("../../common/codeIntel/utils/findIndentLevel");
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
		lines,
		move,
		option,
		target,
	) {
		if (target) {
			return dropTargets[target].handleDrop(
				document,
				fromSelection,
				toSelection,
				lines,
				move,
				option,
			);
		}
		
		let edits = [];
		let newSelection;
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
		
		let insertIndentLevel = findIndentLevel(document.lines, toStart);
		
		if (toStart === toEnd) { // insert between lines - no added spaces
			edits.push(document.edit(toStart, 0, indentLines(lines.map(function([indentLevel, line]) {
				return indentStr.repeat(indentLevel) + line;
			}), indentStr, insertIndentLevel)));
			
			newSelection = AstSelection.s(toStart, toStart + lines.length);
		} else { // insert into space - add spaces either side
			let spaces = createSpaces(toEnd - toStart, insertIndentLevel, indentStr);
			
			edits.push(document.edit(toEnd, 0, [
				...indentLines(lines.map(function([indentLevel, line]) {
					return indentStr.repeat(indentLevel) + line;
				}), indentStr, insertIndentLevel),
				
				...spaces,
			]));
			
			newSelection = AstSelection.s(toEnd, toEnd + lines.length);
		}
		
		return {
			edits,
			newSelection,
		};
	},
};
