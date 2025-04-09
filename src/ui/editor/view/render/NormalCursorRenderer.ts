import LineRowRenderer from "./LineRowRenderer";

export default class extends LineRowRenderer {
	constructor(renderer, cursor) {
		super(renderer);
		
		this.cursorToRender = cursor;
		this.canvasRenderer = this.renderer.canvas.normalCursor;
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
			while ("spincheck=100000") {
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
