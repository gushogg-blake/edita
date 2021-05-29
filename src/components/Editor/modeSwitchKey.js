module.exports = function(editor) {
	let keyIsDown = false;
	let keyDownAt;
	let justSwitchedToNormalMode = false;
	
	return {
		keydown(e) {
			if (keyIsDown) {
				return;
			}
			
			justSwitchedToNormalMode = false;
			
			if (editor.mode === "ast") {
				editor.switchToNormalMode();
				
				justSwitchedToNormalMode = true;
				
				return;
			}
			
			editor.switchToAstMode();
			
			keyIsDown = true;
			keyDownAt = Date.now();
		},
		
		keyup(e) {
			let now = Date.now();
			let downTime = now - keyDownAt;
			
			if (editor.mode === "normal") {
				if (justSwitchedToNormalMode) {
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
			
			keyIsDown = false;
			justSwitchedToNormalMode = false;
		},
	};
}
