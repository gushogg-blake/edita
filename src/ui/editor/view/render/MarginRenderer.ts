import type {MarginCanvasRenderer} from "ui/editor/view";
import type Renderer from "./Renderer";
import LineRowRenderer from "./LineRowRenderer";

export default class extends LineRowRenderer {
	declare protected canvasRenderer: MarginCanvasRenderer;
	
	constructor(renderer: Renderer) {
		super(renderer);
		
		this.canvasRenderer = this.renderer.canvas.renderers.margin;
	}
	
	renderRow() {
		if (this.lineRow.startOffset === 0) {
			this.canvasRenderer.drawLineNumber(this.lineIndex);
		}
	}
}
