import {isHeader, isFooter} from "modules/astIntel/utils";
import {AstIntel} from "modules/astIntel";
import pickOptions from "./pickOptions";
import dropTargets from "./dropTargets";
import astManipulations from "./astManipulations";

export default class extends AstIntel {
	pickOptions = pickOptions(this);
	dropTargets = dropTargets(this);
	astManipulations = astManipulations(this);
	
	isBlock(node) {
		return node.isMultiline() && [
			"object",
			"array",
			"parenthesized_expression", // includes if condition brackets
			"arguments",
			"statement_block",
			"class_body",
			"template_string",
			"variable_declarator",
			"switch_body",
		].includes(node.type);
	}
	
	getFooter(node) {
		let {parent} = node;
		
		if (
			parent
			&& this.isBlock(parent)
			&& node.equals(parent.firstChild)
			&& parent.lastChild.end.lineIndex > node.end.lineIndex
		) {
			return parent.lastChild;
		}
		
		return null;
	}
	
	getHeader(node) {
		let {parent} = node;
		
		if (
			parent
			&& this.isBlock(parent)
			&& node.equals(parent.lastChild)
			&& parent.firstChild.start.lineIndex < node.start.lineIndex
		) {
			return parent.firstChild;
		}
		
		return null;
	}
	
	getOpenerAndCloser(node) {
		if ([
			"object",
			"array",
			"parenthesized_expression", // includes if condition brackets
			"statement_block",
			"class_body",
			"template_string",
		].includes(node.type)) {
			return {
				opener: node.firstChild,
				closer: node.lastChild,
			};
		}
		
		return null;
	}
	
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
		
		let isBlock = isHeader(document, fromSelection.startLineIndex);
		let isBelowSibling = lineAbove?.indentLevel === insertIndentLevel && lineAbove.trimmed.length > 0;
		let isAboveSibling = lineBelow?.indentLevel === insertIndentLevel && lineBelow.trimmed.length > 0;
		let isBelowBlock = lineAbove && isFooter(document, insertLineIndex - 1) && !isHeader(document, insertLineIndex - 1);
		let isAboveBlock = lineBelow && isHeader(document, insertLineIndex) && !isFooter(document, insertLineIndex);
		
		return {
			above: isBelowBlock || isBlock && isBelowSibling ? 1 : 0,
			below: isAboveBlock || isBlock && isAboveSibling ? 1 : 0,
		};
	}
}
