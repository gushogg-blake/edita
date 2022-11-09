let LineRowRenderer = require("./LineRowRenderer");

module.exports = class extends LineRowRenderer {
	constructor(renderer) {
		super(renderer);
		
		this.canvasRenderer = this.renderer.canvasRenderers.foldHilites;
	}
	
	renderRow() {
		if (this.foldedLineRow.isFoldHeader) {
			let {line} = this;
			
			this.renderFoldHilites.drawHilite(line.indentCols, line.width - line.indentCols);
		}
	}
	
	endRow() {
		this.canvasRenderer.endRow();
	}
}
