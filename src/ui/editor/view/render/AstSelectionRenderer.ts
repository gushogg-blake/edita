import type {AstSelection} from "core";
import type {AstSelectionRenderer} from "ui/editor/view";
import LineRowRenderer from "./LineRowRenderer";
import type Renderer from "./Renderer";

export default class extends LineRowRenderer {
	private astSelection: AstSelection;
	private hasStartLine: boolean = false;
	private hasEndLine: boolean = false;
	
	declare protected canvasRenderer: AstSelectionRenderer;
	
	constructor(renderer: Renderer, astSelection: AstSelection, canvasRenderer: AstSelectionRenderer) {
		super(renderer);
		
		this.canvasRenderer = canvasRenderer;
		this.astSelection = astSelection;
	}
	
	renderBetweenLines(lineAbove, lineBelow, rowsAboveCurrent, rowsBelowCurrent) {
		let {startLineIndex, endLineIndex} = this.astSelection;
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
