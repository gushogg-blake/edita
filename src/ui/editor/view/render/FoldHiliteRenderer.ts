import type Renderer from "./Renderer";
import LineRowRenderer from "./LineRowRenderer";

export default class extends LineRowRenderer {
	constructor(renderer: Renderer) {
		super(renderer);
		
		this.canvasRenderer = this.renderer.canvas.renderers.foldHilites;
	}
	
	renderRow() {
		if (this.foldedLineRow.isFoldHeader) {
			let {line} = this;
			
			this.canvasRenderer.drawHilite(line.indentCols, line.width - line.indentCols);
		}
	}
}
