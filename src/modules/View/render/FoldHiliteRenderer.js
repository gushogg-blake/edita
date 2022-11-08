let LineRowRenderer = require("./LineRowRenderer");

class FoldHiliteRenderer extends LineRowRenderer {
	constructor(renderer) {
		super(renderer);
		
		this.foldHiliteRenderer = renderer.canvas.foldHiliteRenderer;
	}
	
	renderRow() {
		if (this.foldedLineRow.isFoldHeader) {
			let {line} = this;
			
			this.foldHiliteRenderer.drawHilite(line.indentCols, line.width - line.indentCols);
		}
	}
	
	endRow() {
		this.foldHiliteRenderer.endRow();
	}
}

module.exports = FoldHiliteRenderer;
