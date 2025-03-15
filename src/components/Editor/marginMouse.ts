let {getCursor, getCharCursor} = require("./utils/cursorFromEvent");

module.exports = function(editor, editorComponent) {
	let {document, view} = editor;
	
	function mousedown(e) {
		if (e.button === 2) {
			return;
		}
		
		let {lineIndex} = getCursor(e, view, editorComponent.canvasDiv);
		
		editor.marginMousedown(lineIndex);
	}
	
	return {
		mousedown,
	};
}
