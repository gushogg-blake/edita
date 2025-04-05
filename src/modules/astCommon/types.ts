import type {Document} from "core";

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

