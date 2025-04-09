import type {Canvas as ICanvas, CanvasRenderers as ICanvasRenderers} from "ui/editor/view";

import CurrentLineHiliteRenderer from "./CurrentLineHiliteRenderer";
import NormalSelectionsRenderer from "./NormalSelectionsRenderer";
import AstSelectionRenderer from "./AstSelectionRenderer";
import AstInsertionHiliteRenderer from "./AstInsertionHiliteRenderer";
import MarginRenderer from "./MarginRenderer";
import FoldHilitesRenderer from "./FoldHilitesRenderer";
import CodeRenderer from "./CodeRenderer";
import NormalCursorRenderer from "./NormalCursorRenderer";

import type {Contexts, Offsets} from ".";

export default class CanvasRenderer implements ICanvas {
	layers: Contexts;
	view: View;
	renderers: ICanvasRenderers;
	offsets: Offsets;
	
	constructor(layers: CanvasLayers, view: View) {
		this.layers = layers;
		this.view = view;
		
		this.renderers = {
			currentLineHilite: new CurrentLineHiliteRenderer(this),
			normalHilites: new NormalSelectionsRenderer(this, "hiliteBackground"),
			normalSelection: new NormalSelectionsRenderer(this, "selectionBackground"),
			astSelection: new AstSelectionRenderer(this, "astSelectionBackground"),
			astSelectionHilite: new AstSelectionRenderer(this, "astSelectionHiliteBackground"),
			astInsertionHilite: new AstInsertionHiliteRenderer(this),
			margin: new MarginRenderer(this),
			foldHilites: new FoldHilitesRenderer(this),
			normalCursor: new NormalCursorRenderer(this),
			
			// this is a function as the view creates a CodeRenderer dynamically
			// for each scope.
			code: () => new CodeRenderer(this),
		};
	}
	
	render(uiState: UiState): void {
		if (base.getPref("dev.timing.render")) {
			console.time("render");
		}
		
		this.init();
		
		view.render(this, uiState);
		
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
