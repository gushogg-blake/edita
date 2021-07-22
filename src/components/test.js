module.exports = function(editor) {
	let keyIsDown = false;
	let keyDownAt;
	let justSwitchedToNormalMode = false;
	
	// comment
	
	/*
	comment
	*/
	
	return {
		keydown(e) {
			if (keyIsDown) {
				return;
			}
			
			keyIsDown = true;
			keyDownAt = Date.now();
			justSwitchedToNormalMode = false;
			
			if (editor.mode === "ast") {
				editor.switchToNormalMode();
				
				justSwitchedToNormalMode = true;
				
				return;
			}
			
			editor.switchToAstMode();
		},
		
		keyup(e) {
			let now = Date.now();
			let downTime = now - keyDownAt;
			
			keyIsDown = false;
			
			if (editor.mode === "normal") {
				if (justSwitchedToNormalMode) {
					justSwitchedToNormalMode = false;
				
					return;
				}
				
				if (downTime < editor.minHoldTime) {
					editor.switchToAstMode();
				}
			} else {
				if (downTime >= editor.minHoldTime) {
					editor.switchToNormalMode();
				}
			}
			
			justSwitchedToNormalMode = false;
		},
	};
}
