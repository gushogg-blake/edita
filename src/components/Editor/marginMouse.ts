import {getCursor, getCharCursor} from "./utils/cursorFromEvent";

export default function(editor, editorComponent) {
	let {document, view} = editor;
	
	function mousedown({originalEvent: e}) {
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
