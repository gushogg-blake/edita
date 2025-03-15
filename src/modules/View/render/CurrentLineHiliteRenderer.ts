let LineRowRenderer = require("./LineRowRenderer");

export default class extends LineRowRenderer {
	constructor(renderer) {
		super(renderer);
		
		this.canvasRenderer = this.renderer.canvasRenderers.currentLineHilite;
	}
	
	renderRow() {
		
	}
}
