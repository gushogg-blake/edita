let getKeyCombo = require("../../utils/getKeyCombo");
let clipboard = require("../../modules/ipc/clipboard/renderer");

module.exports = function(editor) {
	let keymap = {
		"PageUp": "pageUp",
		"PageDown": "pageDown",
		"Escape": "switchToNormalMode",
		"j": "down",
	};
	
	let functions = {
		switchToNormalMode() {
			editor.switchToNormalMode();
			editor.startCursorBlink();
		},
		
		j({document, selection}) {
			console.log("test");
		},
		
		J({document, selection}) {
			console.log("J");
		},
		
		down({document, selection}) {
			editor.setSelection(document.lang.codeIntel.astSelection.down(document.lines, selection));
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
