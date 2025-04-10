import type {AstInsertionHiliteCanvasRenderer} from "ui/editor/view";
import type {CanvasRenderer} from ".";

let lineThickness = 2;
let lineWidth = 35;
let yHint = 2;

export default function(canvasRenderer: CanvasRenderer): AstInsertionHiliteCanvasRenderer {
	let {layers, view, offsets} = canvasRenderer;
	let {marginOffset} = view.sizes;
	let {colWidth, rowHeight} = view.measurements;
	
	let context = layers.hilites;
	
	let x;
	let y = offsets.rowOffset;
	
	let startY;
	let endY;
	
	return {
		init() {
			context.fillStyle = base.theme.editor.astInsertionHiliteBackground;
		},
		
		setStartLine(indentCols: number, rowsAboveCurrent: number) {
			x = Math.max(offsets.leftEdge + indentCols * colWidth, marginOffset);
			startY = y - rowsAboveCurrent * rowHeight;
		},
		
		setEndLine(rowsBelowCurrent: number) {
			endY = y + rowsBelowCurrent * rowHeight;
			
			let height = endY - startY;
			
			if (height === 0) {
				context.fillRect(x, y, lineWidth, lineThickness);
			} else {
				let middle = startY + Math.round(height / 2) - Math.round(lineThickness / 2) + yHint;
				
				context.fillRect(x, middle, lineWidth, lineThickness);
				
				context.save();
				
				context.translate(x + lineWidth / 2, middle + lineThickness / 2);
				context.rotate(45 * Math.PI / 180);
				context.fillRect(-4.5, -4.5, 9, 9);
				
				context.restore();
			}
		},
		
		endRow() {
			y += rowHeight;
		},
	};
}
