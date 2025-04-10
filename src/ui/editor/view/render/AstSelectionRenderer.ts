import type {AstSelectionRenderer} from "ui/editor/view";
import LineRowRenderer from "./LineRowRenderer";
import type Renderer from "./Renderer";

export default class extends LineRowRenderer {
	constructor(renderer: Renderer, selection: AstSelection, canvasRenderer: AstSelectionRenderer) {
		super(renderer);
		
		this.canvasRenderer = canvasRenderer;
		this.selection = selection;
		
		this.hasStartLine = false;
		this.hasEndLine = false;
	}
	
	renderBetweenLines(lineAbove, lineBelow, rowsAboveCurrent, rowsBelowCurrent) {
		let {startLineIndex, endLineIndex} = this.selection;
		let lineIndex = lineBelow ? lineBelow.lineIndex : lineAbove.lineIndex + 1;
		
		if (lineIndex >= startLineIndex && lineIndex <= endLineIndex && !this.hasStartLine) {
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
