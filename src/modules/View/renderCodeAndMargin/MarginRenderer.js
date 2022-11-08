let LineRowRenderer = require("./LineRowRenderer");

class MarginRenderer extends LineRowRenderer {
	constructor(renderer) {
		super(renderer);
		
		this.marginRenderer = this.renderer.canvas.marginRenderer;
	}
	
	renderRow() {
		if (this.lineRow.startOffset === 0) {
			this.marginRenderer.drawLineNumber(this.lineIndex);
		}
	}
	
	endRow() {
		this.marginRenderer.endRow();
	}
}

module.exports = MarginRenderer;
