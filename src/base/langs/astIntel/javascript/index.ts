import {isHeader, isFooter} from "modules/astIntel/utils";
import pickOptions from "./pickOptions";
import dropTargets from "./dropTargets";
import astManipulations from "./astManipulations";

export default {
	pickOptions,
	dropTargets,
	astManipulations,
	
	adjustSpaces(
		document,
		fromSelection,
		toSelection,
		selectionLines,
		insertLines,
		insertIndentLevel,
	) {
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
		
		let isBlock = isHeader(document, fromSelection.startLineIndex);
		let isBelowSibling = lineAbove?.indentLevel === insertIndentLevel && lineAbove.trimmed.length > 0;
		let isAboveSibling = lineBelow?.indentLevel === insertIndentLevel && lineBelow.trimmed.length > 0;
		let isBelowBlock = lineAbove && isFooter(document, insertLineIndex - 1) && !isHeader(document, insertLineIndex - 1);
		let isAboveBlock = lineBelow && isHeader(document, insertLineIndex) && !isFooter(document, insertLineIndex);
		
		return {
			above: isBelowBlock || isBlock && isBelowSibling ? 1 : 0,
			below: isAboveBlock || isBlock && isAboveSibling ? 1 : 0,
		};
	},
};
