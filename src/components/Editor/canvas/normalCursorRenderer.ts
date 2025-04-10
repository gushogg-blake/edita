import type {NormalCursorRenderer} from "ui/editor/view";
import type {CanvasRenderer} from ".";

export default function(canvasRenderer: CanvasRenderer): NormalCursorRenderer {
	let {layers, view, offsets} = canvasRenderer;
	let {colWidth, rowHeight} = view.measurements;
	let {leftEdge, rowOffset} = offsets;
	
	let context = layers.code;
	
	let y = rowOffset;
	let col;
	
	return {
		init() {
			context.fillStyle = base.theme.editor.cursorColor;
		},
		
		startRow(wrapIndentCols: number) {
			col = wrapIndentCols;
		},
		
		endRow() {
			y += rowHeight;
		},
		
		skipText(cols: number) {
			col += cols;
		},
		
		draw() {
			context.fillRect(Math.round(leftEdge + col * colWidth), y, 1, rowHeight);
		},
	};
}
