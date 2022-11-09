let LineRowRenderer = require("./LineRowRenderer");

/*
let {
	normalSelection,
	insertCursor,
	measurements,
	focused,
	cursorBlinkOn,
} = view;

if (!cursorBlinkOn || !focused || !windowHasFocus || insertCursor) {
	return;
}

let [x, y] = view.screenCoordsFromCursor(normalSelection.end);

if (x < view.sizes.marginWidth) {
	return;
}
*/

module.exports = class extends LineRowRenderer {
	constructor(renderer) {
		super(renderer);
		
		this.canvasRenderer = this.renderer.canvasRenderers.normalCursor;
	}
	
	renderRow() {
		
	}
	
	endRow() {
		this.canvasRenderer.endRow();
	}
}
