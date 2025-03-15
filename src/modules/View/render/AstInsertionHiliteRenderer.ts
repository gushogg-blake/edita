import LineRowRenderer from "./LineRowRenderer";

export default class extends LineRowRenderer {
	constructor(renderer) {
		super(renderer);
		
		this.canvasRenderer = this.renderer.canvasRenderers.astInsertionHilite;
		this.hilite = this.renderer.view.astInsertionHilite;
	}
	
	renderBetweenLines(lineAbove, lineBelow, rowsAboveCurrent, rowsBelowCurrent) {
		let {startLineIndex, endLineIndex} = this.hilite;
		let lineIndex = lineBelow ? lineBelow.lineIndex : lineAbove.lineIndex + 1;
		
		if (lineIndex === startLineIndex) {
			let indentCols = Math.max(lineAbove?.indentCols || 0, lineBelow?.indentCols || 0);
			
			this.canvasRenderer.setStartLine(indentCols, rowsAboveCurrent);
		}
		
		if (lineIndex === endLineIndex) {
			this.canvasRenderer.setEndLine(rowsBelowCurrent);
		}
	}
}
