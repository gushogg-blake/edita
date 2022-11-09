let LineRowRenderer = require("./LineRowRenderer");

module.exports = class extends LineRowRenderer {
	constructor(renderer) {
		super(renderer);
		
		this.renderFoldHilites = renderer.canvas.foldHilites;
	}
	
	renderRow() {
		if (this.foldedLineRow.isFoldHeader) {
			let {line} = this;
			
			this.renderFoldHilites.drawHilite(line.indentCols, line.width - line.indentCols);
		}
	}
	
	endRow() {
		this.renderFoldHilites.endRow();
	}
}
