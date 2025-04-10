import type {FoldHiliteCanvasRenderer} from "ui/editor/view";
import type {CanvasRenderer} from ".";

export default function(canvasRenderer: CanvasRenderer): FoldHiliteCanvasRenderer {
	let {layers, view, offsets} = canvasRenderer;
	let {colWidth, rowHeight} = view.measurements;
	
	let {
		foldHeaderBorder,
		foldHeaderBackground,
	} = base.theme.editor;
	
	let context;
	
	let y = offsets.rowOffset;
	
	return {
		drawHilite(indentCols: number, lineWidth: number) {
			let x = Math.round(offsets.leftEdge + indentCols * colWidth);
			let width = Math.round(lineWidth * colWidth);
			
			context = layers.hilites;
			
			context.save();
			
			context.translate(0.5, 0.5);
			context.lineWidth = 1;
			context.strokeStyle = foldHeaderBorder;
			context.strokeRect(x - 1, y, width + 1, rowHeight - 1);
			
			context.restore();
			
			context = layers.foldHilites;
			
			context.fillStyle = foldHeaderBackground;
			context.fillRect(x, y, width, rowHeight);
		},
		
		endRow() {
			y += rowHeight;
		},
	};
}
