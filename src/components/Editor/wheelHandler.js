let getWheelCombo = require("utils/getWheelCombo");
let {getCursor} = require("./utils/cursorFromEvent");

module.exports = function(editor, editorComponent) {
	let {view} = editor;
	
	function wheel(e) {
		let wheelCombo = getWheelCombo(e);
		
		if (editor.willHandleWheel(wheelCombo)) {
			e.preventDefault();
			e.stopPropagation();
			
			editor.handleWheel(wheelCombo, getCursor(e, view, editorComponent.canvasDiv));
			
			return;
		}
		
		if (wheelCombo.isModified) {
			return;
		}
		
		let dir = e.deltaY > 0 ? 1 : -1;
		let scrolled;
		
		if (e.shiftKey) {
			scrolled = view.scrollBy(view.measurements.colWidth * 3 * dir, 0);
		} else {
			scrolled = view.scrollBy(0, view.measurements.rowHeight * 3 * dir);
		}
		
		if (scrolled || editorComponent.editorMode === "app") {
			e.preventDefault();
			e.stopPropagation();
		}
	}
	
	return {
		wheel,
	};
}
	