module.exports = function(editor) {
	let keyIsDown = false;
	let keyDownAt;
	let isPeeking = false;
	
	/*
	if we press another key while the mode switch is down, we want to force
	peek regardless of hold time so that e.g. a fast Esc+S from normal mode
	goes up and switches back to normal mode.  Pressing another key also
	cancels the repeat, which means we can use native drag while the Esc key
	is down
	*/
	
	let keyPressedWhilePeeking = false;
	
	function keydown() {
		keyPressedWhilePeeking = true;
	}
	
	return {
		keydown(e) {
			if (keyIsDown) {
				return;
			}
			
			window.addEventListener("keydown", keydown);
			
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
			
			if (editor.mode === "ast") {
				if (downTime >= editor.minHoldTime || keyPressedWhilePeeking) {
					editor.switchToNormalMode();
				} else {
					editor.switchToAstMode(false);
				}
			}
			
			keyIsDown = false;
			keyPressedWhilePeeking = false;
			
			window.removeEventListener("keydown", keydown);
		},
		
		get isPeeking() {
			return isPeeking;
		},
		
		get keyPressedWhilePeeking() {
			return keyPressedWhilePeeking;
		},
	};
}
