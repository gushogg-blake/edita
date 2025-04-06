import type {Selection, Document, Line} from "core";
import type {AstSelectionContents} from "core/astMode";

export {default as selectionUtils} from "./selectionUtils";
export {default as drop} from "./drop";
export {default as astManipulations} from "./astManipulations";
export {default as removeSelection} from "./removeSelection";

export * from "./utils";

interface IAstIntel {
	pickOptions?: Record<string, PickOption>;
	dropTargets?: Record<string, DropTarget>;
	astManipulations?: Record<string, AstManipulation>;
	
	adjustSpaces?: (
		document,
		fromSelection,
		toSelection,
		selectionLines,
		insertLines,
		insertIndentLevel,
	) => any; // TYPE
}

export abstract class AstIntel implements IAstIntel {
	langCode: string;
	
	constructor(langCode: string) {
		this.langCode = langCode;
	}
	
	get lang() {
		return base.langs.get(this.langCode);
	}
}

export type AstManipulation = {
	code: string;
	name: string;
	group?: string;
	isAvailable: () => boolean;
	apply: (multiStepCommant: MultiStepCommand, document: Document, selection: Selection) => AstManipulationResult;
};

export type AstManipulationResult = {
	replaceSelectionWith: AstSelectionContents,
	onPasteFromNormalMode?: (paste: any) => void; // TYPE
};

export type DropTarget = {
	type: string;
	label: string;
	isAvailable: (document: Document, lineIndex: number) => boolean;
	
	handleDrop: (
		document: Document,
		fromSelection: Selection,
		toSelection: Selection,
		lines: Line[],
		move: boolean,
		pickOptionType: string | null,
	) => void;
};

export type PickOption = {
	type: string;
	label: string;
	isAvailable: (document: Document, lineIndex: number) => boolean;
	getSelection: (document: Document, lineIndex: number) => AstSelection;
};

export function astManipulationIsAvailable(
	astManipulation: AstManipulation,
	document: Document,
	selection: Selection,
): boolean {
	return !astManipulation.isAvailable || astManipulation.isAvailable(document, selection);
}

export function getPickOptions(
	astIntel: AstIntel,
	document: Document,
	lineIndex: number,
): PickOption[] {
	return Object.values(astIntel.pickOptions).filter((pickOption) => {
		return pickOption.isAvailable(document, lineIndex);
	});
}

export function getDropTargets(
	astIntel: AstIntel,
	document: Document,
	lineIndex: number,
): DropTarget[] {
	return Object.values(astIntel.dropTargets).filter((dropTarget) => {
		return dropTarget.isAvailable(document, lineIndex);
	});
}
