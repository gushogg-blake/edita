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
	[
		"single line with opener, no footer",
		`
			let a = {
		`,
		0,
		[0, 0],
	],
	[
		"header, footer on next line",
		`
			let a = {
			};
		`,
		0,
		[0, 1],
	],
	[
		"block with body",
		`
			let a = {
				a: 123,
			};
		`,
		0,
		[0, 2],
	],
	[
		"ladder - top",
		`
			if (a) {
				123;
			} else if (b) {
				456;
			} else {
				789;
			}
		`,
		0,
		[0, 2],
	],
	[
		"ladder - middle",
		`
			if (a) {
				123;
			} else if (b) {
				456;
			} else {
				789;
			}
		`,
		2,
		[2, 4],
	],
	[
		"ladder - bottom",
		`
			if (a) {
				123;
			} else if (b) {
				456;
			} else {
				789;
			}
		`,
		4,
		[4, 6],
	],
	[
		"ladder - footer",
		`
			if (a) {
				123;
			} else if (b) {
				456;
			} else {
				789;
			}
		`,
		6,
		[4, 6],
	],
	[
		"multiline array literal with filter - array",
		`
			[
				123,
				456,
				789,
			].filter(function(item) {
				return item % 2 === 0;
			});
		`,
		0,
		[0, 4],
	],
	[
		"multiline array literal with filter - function",
		`
			[
				123,
				456,
				789,
			].filter(function(item) {
				return item % 2 === 0;
			});
		`,
		4,
		[4, 6],
	],
];

describe("JavaScript codeIntel.astSelectionFromLineIndex", function() {
	for (let [name, code, lineIndex, expectedAstSelection] of tests) {
		it(name, function() {
			let doc = new Document(dedent(code).trimRight());
			
			js.parse({
				indentWidth: 4,
			}, doc.lines);
			
			let astSelection = js.codeIntel.astSelectionFromLineIndex(doc.lines, lineIndex);
			
			deep(astSelection, expectedAstSelection);
		});
	}
});
