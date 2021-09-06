let {is, deep} = require("test/utils/assertions");
let dedent = require("test/utils/dedent");
let createJsDoc = require("test/utils/createJsDoc");
let parseIndexMarks = require("test/utils/parseIndexMarks");
let main = require("./main");

let code = dedent(`
	module.exports = {
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
	};
`);

main(async function() {
	let doc = createJsDoc(code);
	
	let lines = doc.getDecoratedLines(5, 10);
	
	console.log(lines);
});
