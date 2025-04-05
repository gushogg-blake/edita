import type {Selection, Document, Line} from "core";
import type AstSelectionContents from "core/astMode";

export {default as selectionUtils} from "./selectionUtils";
export {default as drop} from "./drop";
export {default as astManipulations} from "./astManipulations";
export {default as removeSelection} from "./removeSelection";

export * from "./utils";
//export * from "./types";

import type {Document} from "core";

export type AstIntel = {
	pickOptions: PickOption,
	dropTargets,
	astManipulations,
	
	adjustSpaces: (
		document,
		fromSelection,
		toSelection,
		selectionLines,
		insertLines,
		insertIndentLevel,
	) => any; // TYPE
};

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
	getSelection: (document: Document, lineIndex: number) => Selection;
};

export function astManipulationIsAvailable(astManipulation, document, selection) {
	return !astManipulation.isAvailable || astManipulation.isAvailable(document, selection);
}

export function getPickOptions(astMode, document, lineIndex) {
	return Object.values(astMode.pickOptions).filter(pickOption => pickOption.isAvailable(document, lineIndex));
}

export function getDropTargets(astMode, document, lineIndex) {
	return Object.values(astMode.dropTargets).filter(dropTarget => dropTarget.isAvailable(document, lineIndex));
}
