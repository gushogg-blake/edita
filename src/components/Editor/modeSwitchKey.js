module.exports = function(view, editorComponent) {
	let keyIsDown = false;
	let keyDownAt;
	
	/*
	if we press another key while the mode switch is down, we want to force
	peek regardless of hold time so that e.g. a fast Esc+S from normal mode
	goes up and switches back to normal mode.
	
	Pressing another key also cancels the repeat, which means we can use
	native drag while the Esc key is down
	*/
	
	let keyPressedWhilePeeking = false;
	
	function keydown(e) {
		if (e.key === platform.prefs.modeSwitchKey) {
			return;
		}
		
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
			
			if (view.mode === "ast") {
				editorComponent.switchToNormalMode();
			} else {
				editorComponent.switchToAstMode();
			}
		},
		
		keyup(e) {
			let downTime = Date.now() - keyDownAt;
			
			if (view.mode === "ast") {
				if (downTime >= platform.prefs.minHoldTime || keyPressedWhilePeeking) {
					editorComponent.switchToNormalMode();
				} else {
					editorComponent.switchToAstMode();
				}
			}
			
			keyIsDown = false;
			keyPressedWhilePeeking = false;
			
			window.removeEventListener("keydown", keydown);
		},
		
		get isPeeking() {
			return keyIsDown;
		},
		
		get keyPressedWhilePeeking() {
			return keyPressedWhilePeeking;
		},
	};
}
