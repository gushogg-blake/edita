import LineRowRenderer from "./LineRowRenderer";

export default class extends LineRowRenderer {
	constructor(renderer) {
		super(renderer);
		
		this.canvasRenderer = this.renderer.canvas.foldHilites;
	}
	
	renderRow() {
		if (this.foldedLineRow.isFoldHeader) {
			let {line} = this;
			
			this.canvasRenderer.drawHilite(line.indentCols, line.width - line.indentCols);
		}
	}
}
