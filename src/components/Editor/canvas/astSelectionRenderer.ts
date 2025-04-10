import type {AstSelectionRenderer} from "ui/editor/view";
import type {CanvasRenderer} from ".";

export default function(
	canvasRenderer: CanvasRenderer,
	style: string,
): AstSelectionRenderer {
	let {layers, view, offsets} = canvasRenderer;
	let {width} = view.sizes;
	let {rowHeight} = view.measurements;
	
	let context = layers.hilites;
	
	let y = offsets.rowOffset;
	let startY;
	let endY;
	
	return {
		init() {
			context.fillStyle = style;
		},
		
		setStartLine() {
			startY = y;
		},
		
		setEndLine() {
			endY = y;
		},
		
		endRow() {
			y += rowHeight;
		},
		
		draw() {
			let height = endY - startY;
			
			if (height === 0) {
				context.fillRect(0, startY, width, 2);
			} else {
				context.fillRect(0, startY, width, height);
			}
		},
	};
}
