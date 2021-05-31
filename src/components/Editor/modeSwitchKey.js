module.exports = function(editor) {
	let keyIsDown = false;
	let keyDownAt;
	
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
				if (downTime >= editor.minHoldTime) {
					editor.switchToNormalMode();
				} else {
					editor.switchToAstMode(false);
				}
			}
		},
	};
}
