export interface CanvasRenderer {
	init?: () => void;
	
	/*
	TODO add methods. most are optional; renderers (or Renderer at least)
	checks for them.
	*/
	
	setStartLine(indentCols: number, rowsAboveCurrent: number): void;
	
	setEndLine(rowsBelowCurrent: number): void ;
	
	endRow(): void;
}

/*
TODO these need to be subclassed
*/

export interface CanvasRenderers {
	currentLineHilite: CanvasRenderer;
	normalHilites: CanvasRenderer;
	normalSelection: CanvasRenderer;
	astSelection: CanvasRenderer;
	astSelectionHilite: CanvasRenderer;
	astInsertionHilite: CanvasRenderer;
	margin: CanvasRenderer;
	foldHilites: CanvasRenderer;
	code: CanvasRenderer;
	normalCursor: CanvasRenderer;
}

export interface FoldedLineRow {
	
}
