let LineRowRenderer = require("./LineRowRenderer");

/*
draw(onlyIfPeeking) { // AstSelection.equals(hilite, selection)
	if (onlyIfPeeking && !isPeeking) {
		return;
	}
	
	if (height === 0) {
		context.fillRect(0, y, width, 2);
	} else {
		context.fillRect(0, y, width, height);
	}
},
*/

module.exports = class extends LineRowRenderer {
	constructor(renderer) {
		super(renderer);
		
		this.canvasRenderer = this.renderer.canvasRenderers.astSelectionHilite;
	}
	
	renderRow() {
		
	}
}
