let getKeyCombo = require("../../utils/getKeyCombo");
let clipboard = require("../../modules/ipc/clipboard/renderer");

module.exports = function(editor) {
	let keymap = {
		"PageUp": "pageUp",
		"PageDown": "pageDown",
		"j": "down",
		"k": "up",
		"J": "next",
		"K": "previous",
		"Escape": "switchToNormalMode",
	};
	
	let functions = {
		switchToNormalMode() {
			editor.switchToNormalMode();
			editor.startCursorBlink();
		},
		
		up({document, selection}) {
			editor.setSelection(document.lang.codeIntel.astSelection.up(document.lines, selection));
		},
		
		down({document, selection}) {
			editor.setSelection(document.lang.codeIntel.astSelection.down(document.lines, selection));
		},
		
		next({document, selection}) {
			editor.setSelection(document.lang.codeIntel.astSelection.next(document.lines, selection));
		},
		
		previous({document, selection}) {
			editor.setSelection(document.lang.codeIntel.astSelection.previous(document.lines, selection));
		},
		
		pageUp() {
			editor.scrollPageUp();
		},
		
		pageDown() {
			editor.scrollPageDown();
		},
	};
	
	function keydown(e) {
		let {keyCombo, isModified} = getKeyCombo(e);
		
		if (keymap[keyCombo]) {
			functions[keymap[keyCombo]](editor);
		} else if (functions.default) {
			functions.default(e, keyCombo, isModified, editor);
		}
		
		editor.ensureSelectionIsOnScreen();
		editor.updateScrollbars();
		editor.redraw();
	}
	
	return {
		keydown,
	};
}