import type {AstInsertionHiliteCanvasRenderer} from "ui/editor/view";
import LineRowRenderer from "./LineRowRenderer";
import type Renderer from "./Renderer";

export default class extends LineRowRenderer {
	declare protected canvasRenderer: AstInsertionHiliteCanvasRenderer;
	
	constructor(renderer: Renderer) {
		super(renderer);
		
		this.canvasRenderer = this.renderer.canvas.renderers.astInsertionHilite;
	}
	
	renderBetweenLines(lineAbove, lineBelow, rowsAboveCurrent, rowsBelowCurrent) {
		let {startLineIndex, endLineIndex} = this.renderer.view.astInsertionHilite;
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
