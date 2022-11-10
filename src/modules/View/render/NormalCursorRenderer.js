let LineRowRenderer = require("./LineRowRenderer");

/*
let {
	normalSelection,
	insertCursor,
	measurements,
	focused,
	cursorBlinkOn,
} = view;

if (!cursorBlinkOn || !focused || !windowHasFocus || insertCursor) {
	return;
}

let [x, y] = view.screenCoordsFromCursor(normalSelection.end);

if (x < view.sizes.marginWidth) {
	return;
}
*/

module.exports = class extends LineRowRenderer {
	constructor(renderer) {
		super(renderer);
		
		this.canvasRenderer = this.renderer.canvasRenderers.normalCursor;
	}
	
	renderRow() {
		let {lineIndex, offset} = this.renderer.view.normalSelection.end;
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
			while (true) {
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
