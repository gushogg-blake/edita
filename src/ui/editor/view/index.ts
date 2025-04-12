
export {default as View} from "./View";

export type {default as ViewLine, VariableWidthPart} from "./ViewLine";
export type {LineRow, WrappedLine} from "./wrap";
export type {FoldedLineRow, FoldedWrappedLine} from "./folding";

export * from "./canvasInterface";

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
