module.exports = function(editor) {
	let keyIsDown = false;
	let keyDownAt;
	let forcePeek = false;
	
	return {
		keydown(e) {
			if (keyIsDown) {
				return;
			}
			
			keyIsDown = true;
			keyDownAt = Date.now();
			
			if (editor.mode === "ast") {
				editor.switchToNormalMode();
			} else {
				editor.switchToAstMode(true);
			}
		},
		
		keyup(e) {
			let downTime = Date.now() - keyDownAt;
			
			keyIsDown = false;
			
			if (editor.mode === "ast") {
				if (downTime >= editor.minHoldTime || forcePeek) {
					editor.switchToNormalMode();
				} else {
					editor.switchToAstMode(false);
				}
			}
			
			forcePeek = false;
		},
		
		/*
		if we do an AST edit/navigation while the mode switch key is down,
		force peek regardless of hold time so that e.g. a fast Esc+S from
		normal mode goes up and switches back to normal mode
		*/
		
		forcePeek() {
			forcePeek = true;
		},
	};
}
