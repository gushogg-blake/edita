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
		},
		
		j({document, selection}) {
			console.log("test");
		},
		
		J({document, selection}) {
			console.log("J");
		},
		
		down({document, selection}) {
			editor.setSelection(document.lang.codeIntel.astSelection.down(document.lines, selection);
		},
	};
	
	function keydown(e) {
		
	}
	
	module.exports = {
		keydown,
	};
}
