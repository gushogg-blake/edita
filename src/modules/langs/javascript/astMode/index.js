let pickOptions = require("./pickOptions");
let dropTargets = require("./dropTargets");
let astManipulations = require("./astManipulations");

module.exports = {
	set lang(_lang) {
		this.astManipulations.lang = _lang;
	},
	
	pickOptions,
	dropTargets,
	astManipulations,
	
	adjustSpaces(document, fromSelection, toSelection, selectionLines, insertLines, insertIndentLevel) {
		let spaceBlocks = base.getPref("verticalSpacing.spaceBlocks");
		
		if (!spaceBlocks) {
			return {
				above: 0,
				below: 0,
			};
		}
		
		let insertLineIndex = toSelection.startLineIndex;
		
		let lineAbove = insertLineIndex > 0 ? document.lines[insertLineIndex - 1] : null;
		let lineBelow = insertLineIndex < document.lines.length ? document.lines[insertLineIndex] : null;
		
		let isBlock = document.getHeadersOnLine(fromSelection.startLineIndex).length > 0;
		let isBelowSibling = lineAbove?.indentLevel === insertIndentLevel && lineAbove.trimmed.length > 0;
		let isAboveSibling = lineBelow?.indentLevel === insertIndentLevel && lineBelow.trimmed.length > 0;
		
		let isBelowBlock = (
			lineAbove
			&& document.getFootersOnLine(insertLineIndex - 1).length > 0
			&& document.getHeadersOnLine(insertLineIndex - 1).length === 0
		);
		
		let isAboveBlock = (
			lineBelow
			&& document.getHeadersOnLine(insertLineIndex).length > 0
			&& document.getFootersOnLine(insertLineIndex).length === 0
		);
		
		return {
			above: isBelowBlock || isBlock && isBelowSibling ? 1 : 0,
			below: isAboveBlock || isBlock && isAboveSibling ? 1 : 0,
		};
	},
};
