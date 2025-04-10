export {default as View} from "./View";
export type {Measurements, ScrollPosition, Folds} from "./View";
export type {LineRow, WrappedLine} from "./utils/wrapLine";
export type {FoldedLineRow, FoldedWrappedLine} from "./utils/CanvasUtils";
export type {default as ViewLine, VariableWidthPart} from "./ViewLine";

export interface LineRowCanvasRenderer {
	init?: () => void;
	startRow?: (wrapIndentCols: number) => void;
	endRow?: (isLastRow?: boolean) => void;
}

export interface NormalSelectionCanvasRenderer {
	init(): void;
	startRow(wrapIndentCols: number): void;
	endRow(isLastRow?: boolean): void;
	advance(cols: number): void;
	enterSelection(): void;
	leaveSelection(): void;
	flush(): void;
}

export interface NormalCursorCanvasRenderer {
	init(): void;
	startRow(wrapIndentCols: number): void;
	endRow(): void;
	skipText(cols): void;
	draw(): void;
}

export interface MarginCanvasRenderer {
	init(): void;
	drawLineNumber(lineIndex: number): void;
	endRow(): void;
}

export interface FoldHiliteCanvasRenderer {
	drawHilite(indentCols: number, lineWidth: number): void;
	endRow(): void;
}

export interface CurrentLineHiliteCanvasRenderer {
	init(): void;
}

export interface CodeCanvasRenderer {
	init(): void;
	setStyle(style: any /* TYPE */): void;
	startRow(wrapIndentCols: number): void;
	endRow(): void;
	drawTab(width: number): void;
	drawText(string: string): void;
	skipText(string: string): void;
}

export interface AstSelectionCanvasRenderer {
	init(): void;
	setStartLine(): void;
	setEndLine(): void;
	endRow(): void;
	draw(): void;
}

export interface AstInsertionHiliteCanvasRenderer {
	init(): void;
	setStartLine(indentCols: number, rowsAboveCurrent: number): void;
	setEndLine(rowsBelowCurrent: number): void;
	endRow(): void;
}

export interface CanvasRenderers {
	currentLineHilite: CurrentLineHiliteCanvasRenderer;
	normalHilites: NormalSelectionCanvasRenderer;
	normalSelection: NormalSelectionCanvasRenderer;
	astSelection: AstSelectionCanvasRenderer;
	astSelectionHilite: AstSelectionCanvasRenderer;
	astInsertionHilite: AstInsertionHiliteCanvasRenderer;
	margin: MarginCanvasRenderer;
	foldHilites: FoldHiliteCanvasRenderer;
	normalCursor: NormalCursorCanvasRenderer;
	code(): CodeCanvasRenderer;
}

export interface Canvas {
	renderers: CanvasRenderers;
}

export interface UiState {
	isPeekingAstMode: boolean;
	windowHasFocus: boolean;
}
