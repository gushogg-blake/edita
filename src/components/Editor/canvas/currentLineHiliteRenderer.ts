import type {CurrentLineHiliteRenderer} from "ui/editor/view";
import type {CanvasRenderer} from ".";

export default function(canvasRenderer: CanvasRenderer): CurrentLineHiliteRenderer {
	let {layers, view, offsets} = canvasRenderer;
	let {colWidth, rowHeight} = view.measurements;
	
	return {};
}
