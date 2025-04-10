import type {Cursor} from "core";

export {default as View} from "./View";

export type {LineRow, WrappedLine} from "./utils/wrapLine";
export type {FoldedLineRow, FoldedWrappedLine} from "./utils/CanvasUtils";
export type {default as ViewLine, VariableWidthPart} from "./ViewLine";
export * from "./canvasInterface";

export type ActiveCompletions = {
	completions: any[], // TYPE LSP
	selectedCompletion: any; // ^
	cursor: Cursor;
};

export type Measurements = {
	rowHeight: number;
	colWidth: number;
};

export type MarginStyle = {
	margin: number;
	paddingLeft: number;
	paddingRight: number;
};

export type Sizes = {
	width: number;
	height: number;
	topMargin: number;
	marginWidth: number;
	marginOffset: number;
	marginStyle: MarginStyle;
	codeWidth: number;
	rows: number;
	cols: number;
};

export type ScrollPosition = {
	x: number;
	y: number;
};

export type Folds = Record<string, number>;
