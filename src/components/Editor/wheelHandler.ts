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
			//return;
		}
		
		let scrolled;
		let {deltaX, deltaY} = e;
		
		if (e.shiftKey) {
			deltaX = deltaY;
			deltaY = 0;
		}
		
		if (e.ctrlKey) {
			let multiplier = base.getPref("ctrlScrollMultiplier");
			
			deltaX *= multiplier;
			deltaY *= multiplier;
		}
		
		scrolled = view.scrollBy(deltaX, deltaY);
		
		if (scrolled) {
			e.preventDefault();
			e.stopPropagation();
		}
	}
	
	return {
		wheel,
	};
}
	