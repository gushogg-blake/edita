export {default as View} from "./View";

export interface NormalSelectionRenderer {
	init(): void;
	startRow(wrapIndentCols: number): void;
	endRow(isLastRow: boolean): void;
	advance(cols: number): void;
	enterSelection(): void;
	leaveSelection(): void;
	flush(): void;
}

export interface NormalCursorRenderer {
	init(): void;
	startRow(wrapIndentCols: number): void;
	endRow(): void;
	skipText(cols): void;
	draw(): void;
}

export interface MarginRenderer {
	init(): void;
	drawLineNumber(lineIndex: number): void;
	endRow(): void;
}

export interface FoldHiliteRenderer {
	drawHilite(indentCols: number, lineWidth: number): void;
	endRow(): void;
}

export interface CurrentLineHiliteRenderer {
	// not implemented yet
}

export interface CodeRenderer {
	init(): void;
	setStyle(style: any /* TYPE */): void;
	startRow(wrapIndentCols: number): void;
	endRow(): void;
	drawTab(width: number): void;
	drawText(string: string): void;
	skipText(string: string): void;
}

export interface AstSelectionRenderer {
	init(): void;
	setStartLine(): void;
	setEndLine(): void;
	endRow(): void;
	draw(): void;
}

export interface AstInsertionHiliteRenderer {
	init(): void;
	setStartLine(indentCols: number, rowsAboveCurrent: number): void;
	setEndLine(rowsBelowCurrent: number): void;
	endRow(): void;
}

export interface CanvasRenderers {
	currentLineHilite: CurrentLineHiliteRenderer;
	normalHilites: NormalSelectionRenderer;
	normalSelection: NormalSelectionRenderer;
	astSelection: AstSelectionRenderer;
	astSelectionHilite: AstSelectionRenderer;
	astInsertionHilite: AstInsertionHiliteRenderer;
	margin: MarginRenderer;
	foldHilites: FoldHiliteRenderer;
	code: CodeRenderer;
	normalCursor: NormalCursorRenderer;
}

export interface Canvas {
	renderers: CanvasRenderers;
}

export interface UiState {
	isPeekingAstMode: boolean;
	windowHasFocus: boolean;
}

export interface FoldedLineRow {
	
}
