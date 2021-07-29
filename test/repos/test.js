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
			if
			editor.switchToAstMode();
		},
