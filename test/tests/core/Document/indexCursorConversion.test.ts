import {Document} from "core";
import {is, deep} from "test/utils/assertions";
import dedent from "test/utils/dedent";
import createJsDoc from "test/utils/createJsDoc";
import parseIndexMarks from "test/utils/parseIndexMarks";

let {
	string: code,
	marks,
} = parseIndexMarks(dedent(`
	<@0,0>m<@0,1>odule.exports = <@0,17>{<@0,18>
	<@1,0>	<@1,1>keydown(e) {
			if (keyIsDown) {
				return;
			}
			
			keyIsDown = true;
			keyDownAt = Date.now();
			justSwitchedToNormalMode = false;
			
			if (editor.mode === "ast") {
				editor.switchToNormalMode();
				
				justSwitchedToNormalMode = true;
				
				return;<@15,10>
			}
			
			editor.switchToAstMode();
		},
	};<@20,2>
	<@21,0>
`));

let doc;

describe("Document", function() {
	before(async function() {
		doc = await createJsDoc(code);
	});
	
	describe("cursorFromIndex", function() {
		for (let [name, index] of Object.entries(marks)) {
			it(index + " -> " + name, function() {
				let [lineIndex, offset] = name.split(",").map(Number);
				let expectedCursor = {lineIndex, offset};
				
				deep(doc.cursorFromIndex(index), expectedCursor);
			});
		}
	});
	
	describe("indexFromCursor", function() {
		for (let [name, expectedIndex] of Object.entries(marks)) {
			it(name + " -> " + expectedIndex, function() {
				let [lineIndex, offset] = name.split(",").map(Number);
				let cursor = {lineIndex, offset};
				
				is(doc.indexFromCursor(cursor), expectedIndex);
			});
			
			break;
		}
	});
});
