import type {Selection, Document, Line} from "core";
import type AstSelectionContents from "core/astMode";

export {default as selectionUtils} from "./selectionUtils";
export {default as drop} from "./drop";
export {default as astManipulations} from "./astManipulations";
export {default as removeSelection} from "./removeSelection";

export * from "./utils";
export * from "./types";

export function astManipulationIsAvailable(astManipulation, document, selection) {
	return !astManipulation.isAvailable || astManipulation.isAvailable(document, selection);
}

export function getPickOptions(astMode, document, lineIndex) {
	return Object.values(astMode.pickOptions).filter(pickOption => pickOption.isAvailable(document, lineIndex));
}

export function getDropTargets(astMode, document, lineIndex) {
	return Object.values(astMode.dropTargets).filter(dropTarget => dropTarget.isAvailable(document, lineIndex));
}
