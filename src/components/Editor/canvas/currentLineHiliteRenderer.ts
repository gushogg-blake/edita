import type {CurrentLineHiliteCanvasRenderer} from "ui/editor/view";
import type {CanvasRenderer} from ".";

export default function(canvasRenderer: CanvasRenderer): CurrentLineHiliteCanvasRenderer {
	let {layers, view, offsets} = canvasRenderer;
	let {colWidth, rowHeight} = view.measurements;
	
	return {
		init() {
			
		},
	};
}
