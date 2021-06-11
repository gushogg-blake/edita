module.exports = function(editor) {
	let keyIsDown = false;
	let keyDownAt;
	let justSwitchedToNormalMode = false;
	
	return {
		keydown(e) {
			console.log("mode switch keydown");
			
			if (keyIsDown) {
				console.log("key already down");
				
				return;
			}
			
			keyIsDown = true;
			keyDownAt = Date.now();
			
			if (editor.mode === "ast") {
				console.log("switch to normal mode");
				
				editor.switchToNormalMode();
				
				justSwitchedToNormalMode = true;
			} else {
				console.log("switch to ast mode");
				
				editor.switchToAstMode(true);
			}
		},
		
		keyup(e) {
			console.log("mode switch keyup");
			
			let downTime = Date.now() - keyDownAt;
			
			keyIsDown = false;
			
			if (editor.mode === "ast") {
				if (downTime >= editor.minHoldTime) {
					console.log("switch to normal mode");
					
					editor.switchToNormalMode();
				} else {
					console.log("switch to ast mode");
					
					editor.switchToAstMode(false);
				}
			} else {
				console.log("not in ast mode");
			}
		},
	};
}
