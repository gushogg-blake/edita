let LineRowRenderer = require("./LineRowRenderer");

module.exports = class extends LineRowRenderer {
	constructor(renderer) {
		super(renderer);
		
		this.renderFoldHilites = renderer.canvas.foldHilites;
	}
	
	renderRow() {
		
	}
	
	endRow() {
		this.renderFoldHilites.endRow();
	}
}
