let {is, deep} = require("../../../../../../utils/assertions");
let dedent = require("../../../../../../utils/dedent");
let createJsDoc = require("../../../../../../utils/createJsDoc");
let js = require("../../../../../../../src/modules/langs/js");

let tests = [
	[
		"single line",
		`
			let a = 123;
			let b = 456;
			let c = 789;
		`,
		1,
		[1, 2],
	],
	[
		"single line with opener, no footer",
		`
			let a = {
		`,
		0,
		[0, 1],
	],
	[
		"header, footer on next line",
		`
			let a = {
			};
		`,
		0,
		[0, 2],
	],
	[
		"block with body",
		`
			let a = {
				a: 123,
			};
		`,
		0,
		[0, 3],
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
		[0, 3],
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
		[2, 5],
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
		[4, 7],
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
		[4, 7],
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
		[0, 5],
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
		[4, 7],
	],
];

describe("JavaScript codeIntel.astSelection.fromLineIndex", function() {
	for (let [name, code, lineIndex, expectedAstSelection] of tests) {
		it(name, function() {
			let doc = createJsDoc(dedent(code).trimRight());
			
			let astSelection = js.codeIntel.astSelection.selectionFromLineIndex(doc.lines, lineIndex);
			
			deep(astSelection, expectedAstSelection);
		});
	}
});
