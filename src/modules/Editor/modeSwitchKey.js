module.exports = function(editor) {
	let {view} = editor;
	
	let mouseIsDown = false;
	let switchToAstModeOnMouseUp = false;
	
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
	
	function switchToAstMode() {
		if (mouseIsDown) {
			switchToAstModeOnMouseUp = true;
			
			return;
		}
		
		editor.switchToAstMode();
		
		editor.view.redraw();
	}
	
	function switchToNormalMode() {
		editor.switchToNormalMode();
		
		editor.view.redraw();
	}
	
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
			
			if (editor.mode === "ast") {
				switchToNormalMode();
			} else {
				switchToAstMode();
			}
		},
		
		keyup(e) {
			let downTime = Date.now() - keyDownAt;
			
			if (editor.mode === "ast") {
				if (downTime >= platform.prefs.minHoldTime || keyPressedWhilePeeking) {
					switchToNormalMode();
				} else {
					switchToAstMode();
				}
			}
			
			keyIsDown = false;
			keyPressedWhilePeeking = false;
			
			window.removeEventListener("keydown", keydown);
		},
		
		mousedown() {
			mouseIsDown = true;
		},
		
		mouseup() {
			mouseIsDown = false;
			
			if (switchToAstModeOnMouseUp) {
				switchToAstMode();
				
				view.redraw();
				
				switchToAstModeOnMouseUp = false;
			}
		},
		
		get isPeeking() {
			return keyIsDown;
		},
		
		get keyPressedWhilePeeking() {
			return keyPressedWhilePeeking;
		},
	};
}