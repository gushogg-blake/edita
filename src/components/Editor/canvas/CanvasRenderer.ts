import type {Canvas, CanvasRenderers, UiState} from "ui/editor/view";

import type {Contexts} from "components/Editor";

import currentLineHiliteRenderer from "./currentLineHiliteRenderer";
import normalSelectionRenderer from "./normalSelectionRenderer";
import astSelectionRenderer from "./astSelectionRenderer";
import astInsertionHiliteRenderer from "./astInsertionHiliteRenderer";
import marginRenderer from "./marginRenderer";
import foldHiliteRenderer from "./foldHiliteRenderer";
import codeRenderer from "./codeRenderer";
import normalCursorRenderer from "./normalCursorRenderer";

import type {Offsets} from ".";

export default class CanvasRenderer implements Canvas {
	layers: Contexts;
	view: View;
	renderers: CanvasRenderers;
	offsets: Offsets;
	uiState: UiState;
	
	constructor(layers: Contexts, view: View, uiState: UiState) {
		this.layers = layers;
		this.view = view;
		this.uiState = uiState;
		
		this.renderers = {
			currentLineHilite: currentLineHiliteRenderer(this),
			normalHilites: normalSelectionRenderer(this, "hiliteBackground"),
			normalSelection: normalSelectionRenderer(this, "selectionBackground"),
			astSelection: astSelectionRenderer(this, "astSelectionBackground"),
			astSelectionHilite: astSelectionRenderer(this, "astSelectionHiliteBackground"),
			astInsertionHilite: astInsertionHiliteRenderer(this),
			margin: marginRenderer(this),
			foldHilites: foldHiliteRenderer(this),
			normalCursor: normalCursorRenderer(this),
			
			// this is a function as the view creates a CodeRenderer dynamically
			// for each scope.
			code: () => codeRenderer(this),
		};
	}
	
	render(): void {
		if (base.getPref("dev.timing.render")) {
			console.time("render");
		}
		
		this.init();
		
		view.render(this, this.uiState);
		
		if (base.getPref("dev.timing.render")) {
			console.timeEnd("render");
		}
	}
	
	private init() {
		let {layers, view} = this;
		
		let {
			sizes: {width, height, topMargin, marginOffset},
			measurements: {rowHeight},
			scrollPosition,
		} = view;
		
		let start = performance.now();
		
		if (base.getPref("dev.timing.render")) {
			console.time("render");
		}
		
		this.offsets = {
			leftEdge: marginOffset - scrollPosition.x,
			rowOffset: -((scrollPosition.y - topMargin) % rowHeight),
		};
		
		for (let context of Object.values(layers)) {
			context.clearRect(0, 0, width, height);
		}
		
		layers.background.fillStyle = base.theme.editor.background;
		
		layers.background.fillRect(0, 0, width, height);
	}
}
