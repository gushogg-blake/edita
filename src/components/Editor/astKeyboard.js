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
		"Enter": "toggleSpaceAbove",
		"Shift+Enter": "toggleSpaceBelow",
	};
	
	let functions = {
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
		
		toggleSpaceAbove() {
			console.log("toggle space above");
		},
		
		toggleSpaceBelow() {
			console.log("toggle space below");
		},
	};
	
	async function keydown(e) {
		let handled = false;
		let {keyCombo, isModified} = getKeyCombo(e);
		
		if (keymap[keyCombo]) {
			e.preventDefault();
			
			await functions[keymap[keyCombo]](editor);
			
			handled = true;
		} else if (functions.default) {
			handled = functions.default(e, keyCombo, isModified, editor);
		}
		
		if (handled) {
			editor.ensureSelectionIsOnScreen();
			editor.updateScrollbars();
			editor.redraw();
		}
	}
	
	return {
		keydown,
	};
}
