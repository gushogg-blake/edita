let LineRowRenderer = require("./LineRowRenderer");

module.exports = class extends LineRowRenderer {
	constructor(renderer) {
		super(renderer);
		
		this.canvasRenderer = this.renderer.canvasRenderers.astSelection;
		
		this.selection = this.renderer.view.astSelection;
		this.hasStartLine = false;
		this.hasEndLine = false;
	}
	
	renderRow() {
		if (this.selection.endLineIndex < this.lineIndex) {
			return;
		}
		
		if (this.lineIndex >= this.selection.startLineIndex && !this.hasStartLine) {
			this.canvasRenderer.setStartLine();
			
			this.hasStartLine = true;
		}
		
		if (this.lineIndex === this.selection.endLineIndex) {
			this.canvasRenderer.setEndLine();
			
			this.hasEndLine = true;
		}
	}
	
	flush() {
		if (this.hasStartLine) {
			if (!this.hasEndLine) {
				this.canvasRenderer.setEndLine();
			}
			
			this.canvasRenderer.draw();
		}
	}
}
