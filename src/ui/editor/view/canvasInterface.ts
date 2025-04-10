import type {HiliteStyle} from "core/hiliting";

/*
these interfaces define the interface between the View and the rendering
code in the Editor component.

specifically, this is the interface the View expects as its abstraction
for drawing to the canvas.

there are a bunch of modules that kind of mirror each other between the
two, as rendering concerns are split between them.

the Editor component knows about:

- drawing to the canvas

- the different layers that the canvas is made up of (it's actually
  multiple canvases)

- incrementing offsets by the correct pixel amount to go to the next row

- that the View needs an abstracted Canvas object to do its rendering

the View rendering code knows about:

- going from a View state (scrollPosition, wrappedLines, selections etc)
  and a Document, to a plan for efficiently rendering the code, margin,
  selections, etc to the canvas.

the form the Canvas interface takes is a bundle of "canvas renderers"
for the different things that need to be rendered (code, selections, etc)

each canvas renderer is different but some are similar, e.g. a lot of
them have a function for "go to the next row".

there is also UiState for some misc UI state (whether the window is
focused, whether we're peeking AST mode).

see notes in the relevant files/dirs for more details
*/

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
	setStyle(style: HiliteStyle): void;
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
