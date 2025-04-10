import type {FoldHiliteRenderer} from "ui/editor/view";
import type Renderer from "./Renderer";
import LineRowRenderer from "./LineRowRenderer";

export default class extends LineRowRenderer {
	declare protected canvasRenderer: FoldHiliteRenderer;
	
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
