import LineRowRenderer from "./LineRowRenderer";
import type Renderer from "./Renderer";

export default class extends LineRowRenderer {
	constructor(renderer: Renderer) {
		super(renderer);
		
		this.canvasRenderer = this.renderer.canvasRenderers.currentLineHilite;
	}
	
	renderRow() {
		
	}
}
