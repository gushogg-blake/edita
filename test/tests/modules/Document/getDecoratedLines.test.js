let {is, deep} = require("test/utils/assertions");
let dedent = require("test/utils/dedent");

let Document = require("modules/Document");

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

let tests = [
	
];

let doc;

describe("Document.getDecoratedLines", function() {
	beforeEach(function() {
		doc = new Document(code, "a.js");
	});
	
	it("init", function() {
		//console.log(doc.getDecoratedLines());
	});
});
