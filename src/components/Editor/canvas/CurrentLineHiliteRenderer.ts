import type {CurrentLineHiliteRenderer} from "ui/editor/view";
import type {CanvasRenderer} from ".";

export default class implements CurrentLineHiliteRenderer {
	private context: CanvasRenderingContext2D;
	
	constructor(canvasRenderer: CanvasRenderer) {
		this.context = canvasRenderer.layers.hilites;
	}
	
	init() {
		this.state = {
			
		};
	}
	let {
		sizes: {width},
		measurements: {rowHeight},
	} = view;
	
	let context = layers.hilites;
	
	//let x;
	let y = offsets.rowOffset;
	
	let startY;
	let endY;
	
	return {
		init() {
			//context.fillStyle = base.theme.editor.currentLineHiliteBackground;
		},
		
		startRow() {
		},
		
		endRow() {
		},
	};
}
