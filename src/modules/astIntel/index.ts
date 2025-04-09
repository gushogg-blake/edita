import type {AstSelection, Document, Node, Line} from "core";
import type {AstSelectionContents, PickOptionType, DropTargetType, AstManipulation} from "core/astMode";

export {default as selectionUtils} from "./selectionUtils";
export {default as drop} from "./drop";
export {default as astManipulations} from "./astManipulations";
export {default as removeSelection} from "./removeSelection";

export * from "./utils";

export abstract class AstIntel {
	langCode: string;
	
	pickOptions?: Record<string, PickOptionType>;
	dropTargets?: Record<string, DropTargetType>;
	astManipulations?: Record<string, AstManipulation>;
	
	constructor(langCode: string) {
		this.langCode = langCode;
	}
	
	get lang() {
		return base.langs.get(this.langCode);
	}
	
	isBlock(node: Node): boolean {
		return false;
	}
	
	getHeader(node: Node): Node | null {
		return null;
	}
	
	getFooter(node: Node): Node | null {
		return null;
	}
	
	getOpenerAndCloser(node: Node): {opener: Node; closer: Node} | null {
		return null;
	}
	
	adjustSpaces(
		document,
		fromSelection,
		toSelection,
		selectionLines,
		insertLines,
		insertIndentLevel,
	): {above: number; below: number} {
		return {above: 0, below: 0};
	}
}

export function astManipulationIsAvailable(
	astManipulation: AstManipulation,
	document: Document,
	selection: AstSelection,
): boolean {
	return !astManipulation.isAvailable || astManipulation.isAvailable(document, selection);
}

export function getAvailablePickOptionTypes(
	astIntel: AstIntel,
	document: Document,
	lineIndex: number,
): PickOptionType[] {
	return Object.values(astIntel.pickOptions).filter((type) => {
		return type.isAvailable(document, lineIndex);
	});
}

export function getAvailableDropTargetTypes(
	astIntel: AstIntel,
	document: Document,
	lineIndex: number,
): DropTargetType[] {
	return Object.values(astIntel.dropTargets).filter((type) => {
		return type.isAvailable(document, lineIndex);
	});
}
