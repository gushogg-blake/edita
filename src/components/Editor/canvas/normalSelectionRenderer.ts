import type {NormalSelectionRenderer} from "ui/editor/view";
import type {CanvasRenderer} from ".";

export default function(
	canvasRenderer: CanvasRenderer,
	style: string,
): NormalSelectionRenderer {
	let {layers, view, offsets} = canvasRenderer;
	let {colWidth, rowHeight} = view.measurements;
	
	let context = layers.hilites;
	
	let y = offsets.rowOffset;
	let col;
	let startCol;
	let inSelection = false;
	
	function draw() {
		let x = offsets.leftEdge + startCol * colWidth;
		let width = (col - startCol) * colWidth;
		
		context.fillRect(x, y, width, rowHeight);
	}
	
	return {
		init() {
			context.fillStyle = style;
		},
		
		startRow(wrapIndentCols: number) {
			col = wrapIndentCols;
			
			if (inSelection) {
				startCol = col;
			}
		},
		
		endRow(isLastRow: boolean) {
			if (inSelection) {
				if (isLastRow) {
					col++;
				}
				
				draw();
			}
			
			y += rowHeight;
		},
		
		advance(cols: number) {
			col += cols;
		},
		
		enterSelection() {
			startCol = col;
			inSelection = true;
		},
		
		leaveSelection() {
			draw();
			
			inSelection = false;
		},
		
		flush() {
			if (inSelection) {
				draw();
			}
		},
	};
}
