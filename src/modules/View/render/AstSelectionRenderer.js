let LineRowRenderer = require("./LineRowRenderer");

module.exports = class extends LineRowRenderer {
	constructor(renderer, selection, canvasRenderer) {
		super(renderer);
		
		this.canvasRenderer = canvasRenderer;
		this.selection = selection;
		
		this.hasStartLine = false;
		this.hasEndLine = false;
	}
	
	renderBetweenLines(lineAbove, lineBelow, rowsAboveCurrent, rowsBelowCurrent) {
		let {startLineIndex, endLineIndex} = this.selection;
		let lineIndex = lineBelow ? lineBelow.lineIndex : lineAbove.lineIndex + 1;
		
		if (lineIndex >= startLineIndex && !this.hasStartLine) {
			this.canvasRenderer.setStartLine();
			
			this.hasStartLine = true;
		}
		
		if (lineIndex === endLineIndex) {
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
