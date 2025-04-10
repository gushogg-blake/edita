export default function(editor) {
	let {view} = editor;
	
	let mouseIsDown = false;
	let switchToAstModeOnMouseUp = false;
	let switchToNormalModeOnMouseUp = false;
	
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
	}
	
	function switchToNormalMode() {
		editor.switchToNormalMode();
	}
	
	function keydown(e) {
		if (e.key === base.prefs.modeSwitchKey) {
			return;
		}
		
		if (!["Control", "Alt", "Shift", "Command"].includes(e.key)) {
			keyPressedWhilePeeking = true;
		}
	}
	
	function keyup(e) {
		if (e.key !== base.prefs.modeSwitchKey) {
			return;
		}
		
		let downTime = Date.now() - keyDownAt;
		
		if (editor.mode === "ast") {
			/*
			three things indicate we're only intending to peek into AST mode
			to do a single action:
			
			- holding it for more than a normal keypress length
			- pressing another key while it's down -- using it like a modifier
			- if we're dragging with the mouse
			*/
			
			if (downTime >= base.prefs.minHoldTime || keyPressedWhilePeeking || mouseIsDown) {
				if (mouseIsDown) {
					switchToNormalModeOnMouseUp = true;
				} else {
					switchToNormalMode();
				}
			} else {
				switchToAstMode();
			}
		}
		
		keyIsDown = false;
		keyPressedWhilePeeking = false;
		
		window.removeEventListener("keydown", keydown);
		window.removeEventListener("keyup", keyup);
	}
	
	return {
		keydown(e) {
			if (keyIsDown) {
				return;
			}
			
			window.addEventListener("keydown", keydown);
			window.addEventListener("keyup", keyup);
			
			keyIsDown = true;
			keyDownAt = Date.now();
			
			if (editor.mode === "ast") {
				switchToNormalMode();
			} else {
				switchToAstMode();
			}
		},
		
		mousedown() {
			mouseIsDown = true;
		},
		
		mouseup() {
			mouseIsDown = false;
			
			if (switchToAstModeOnMouseUp) {
				switchToAstMode();
				
				switchToAstModeOnMouseUp = false;
			}
			
			if (switchToNormalModeOnMouseUp) {
				switchToNormalMode();
				
				switchToNormalModeOnMouseUp = false;
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
