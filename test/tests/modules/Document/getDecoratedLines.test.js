let {is, deep} = require("test/utils/assertions");
let dedent = require("test/utils/dedent");
let createJsDoc = require("test/utils/createJsDoc");

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

let doc;

describe("Document.getDecoratedLines", function() {
	let doc = createJsDoc(code);
	
	console.log(doc.getDecoratedLines());
});
