let LineRowRenderer = require("./LineRowRenderer");

module.exports = class extends LineRowRenderer {
	constructor(renderer) {
		super(renderer);
		
		this.canvasRenderer = this.renderer.canvasRenderers.foldHilites;
	}
	
	renderRow() {
		
	}
}
