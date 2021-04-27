let {is, deep} = require("../../../../../utils/assertions");
let dedent = require("../../../../../utils/dedent");
let js = require("../../../../../../src/modules/langs/js");
let Document = require("../../../../../../src/modules/Document");

let tests = [
	[
		"single line",
		`
			let a = 123;
			let b = 456;
			let c = 789;
		`,
		1,
		[1, 1],
	],
];

describe("JavaScript codeIntel.astSelectionFromLineIndex", function() {
	for (let [name, code, lineIndex, expectedAstSelection] of tests) {
		it(name, function() {
			let doc = new Document(dedent(code));
			
			js.parse({
				indentWidth: 4,
			}, doc.lines);
			
			let astSelection = js.codeIntel.astSelectionFromLineIndex(lineIndex);
			
			deep(astSelection, expectedAstSelection);
		});
	}
});
