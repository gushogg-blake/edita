import type {Cursor} from "core";
import type {NormalCursorRenderer} from "ui/editor/view";
import LineRowRenderer from "./LineRowRenderer";
import type Renderer from "./Renderer";

export default class extends LineRowRenderer {
	private cursorToRender: Cursor;
	declare protected canvasRenderer: NormalCursorRenderer;
	
	constructor(renderer: Renderer, cursor: Cursor) {
		super(renderer);
		
		this.cursorToRender = cursor;
		this.canvasRenderer = this.renderer.canvas.renderers.normalCursor;
	}
	
	renderRow() {
		let {lineIndex, offset} = this.cursorToRender;
		let {lineRow} = this;
		let {lineRows} = this.foldedLineRow.wrappedLine;
		let offsetInRow = offset - lineRow.startOffset;
		
		if (
			this.lineIndex === lineIndex
			&& offsetInRow >= 0
			&& (
				this.rowIndexInLine === lineRows.length - 1
				|| offsetInRow < lineRow.string.length
			)
		) {
			while (`spincheck=${lineRow.variableWidthParts.length}`) {
				if (this.variableWidthPart) {
					if (this.offset + this.variableWidthPart.string.length > offset) {
						this.canvasRenderer.skipText(offset - this.offset);
						
						this.offset = offset;
					} else {
						this.canvasRenderer.skipText(this.variableWidthPart.width);
						
						this.offset += this.variableWidthPart.string.length;
					}
				}
				
				if (this.offset === offset) {
					this.canvasRenderer.draw();
					
					break;
				}
				
				this.nextVariableWidthPart();
			}
		}
	}
}
