let getKeyCombo = require("../../utils/getKeyCombo");
let clipboard = require("../../modules/ipc/clipboard/renderer");

module.exports = function(editor) {
	let keymap = {
		"PageUp": "pageUp",
		"PageDown": "pageDown",
		"s": "up",
		"d": "down",
		"j": "next",
		"k": "previous",
		"h": "collapseDown",
		"l": "collapseUp",
		//"e": "expandDown",
		"Space": "toggleSpaceBelow",
		"Shift+Space": "toggleSpaceAbove",
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
		
		expandUp() {
			
		},
		
		expandDown() {
			
		},
		
		contractUp() {
		},
		
		contractDown() {
		},
		
		collapseUp() {
		},
		
		collapseDown() {
			
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
		let {keyCombo, isModified} = getKeyCombo(e);
		
		if (!keymap[keyCombo]) {
			return;
		}
		
		e.preventDefault();
		
		editor.forcePeek();
		
		await functions[keymap[keyCombo]](editor);
		
		editor.ensureSelectionIsOnScreen();
		editor.updateScrollbars();
		editor.redraw();
	}
	
	return {
		keydown,
	};
}
