export {default as View} from "./View";

export interface Canvas {
	renderers: {
		
	};
}

export interface UiState {
	isPeekingAstMode: boolean;
	windowHasFocus: boolean;
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
