import type {Selection, Document, Line} from "core";
import selection from "./selection";
import drop from "./drop";
import astManipulations from "./astManipulations";
import removeSelection from "./removeSelection";
import {getHeaderLineIndex, getFooterLineIndex} from "./utils";

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

export default {
	selection,
	drop,
	astManipulations,
	removeSelection,
	getHeaderLineIndex,
	getFooterLineIndex,
	
	astManipulationIsAvailable(astManipulation, document, selection) {
		return !astManipulation.isAvailable || astManipulation.isAvailable(document, selection);
	},
	
	getPickOptions(astMode, document, lineIndex) {
		return Object.values(astMode.pickOptions).filter(pickOption => pickOption.isAvailable(document, lineIndex));
	},
	
	getDropTargets(astMode, document, lineIndex) {
		return Object.values(astMode.dropTargets).filter(dropTarget => dropTarget.isAvailable(document, lineIndex));
	},
};
