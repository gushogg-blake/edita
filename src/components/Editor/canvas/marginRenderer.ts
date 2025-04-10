import type {MarginCanvasRenderer} from "ui/editor/view";
import type {CanvasRenderer} from ".";

export default function(canvasRenderer: CanvasRenderer): MarginCanvasRenderer {
	let {layers, view, offsets} = canvasRenderer;
	let {height, marginWidth, marginStyle} = view.sizes;
	let {colWidth, rowHeight} = view.measurements;
	
	let {
		fontFamily,
		fontSize,
		marginBackground,
		lineNumberColor,
	} = base.theme.editor;
	
	let context = layers.margin;
	
	let y = offsets.rowOffset + rowHeight; // rowHeight added as using textBaseline="bottom"
	
	return {
		init() {
			context.font = fontSize + " " + fontFamily;
			
			context.fillStyle = marginBackground;
			context.fillRect(0, 0, marginWidth, height);
		},
		
		drawLineNumber(lineIndex: number) {
			let lineNumber = String(lineIndex + 1);
			let x = marginWidth - marginStyle.paddingRight - lineNumber.length * colWidth;
			
			context.fillStyle = lineNumberColor;
			context.fillText(lineNumber, x, y);
		},
		
		endRow() {
			y += rowHeight;
		},
	};
}
