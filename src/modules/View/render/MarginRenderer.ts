let LineRowRenderer = require("./LineRowRenderer");

export default class extends LineRowRenderer {
	constructor(renderer) {
		super(renderer);
		
		this.canvasRenderer = this.renderer.canvasRenderers.margin;
	}
	
	renderRow() {
		if (this.lineRow.startOffset === 0) {
			this.canvasRenderer.drawLineNumber(this.lineIndex);
		}
	}
}
