let {is, deep} = require("../../../../../utils/assertions");
let dedent = require("../../../../../utils/dedent");
let createJsDoc = require("../../../../../utils/createJsDoc");
let getOpenersAndClosersOnLine = require("../../../../../../src/modules/langs/common/codeIntel/getOpenersAndClosersOnLine");

let tests = [
	[
		"none",
		`
			let a = 789;
		`,
		[],
		[],
	],
	[
		"single opener",
		`
			let a = {
		`,
		["{"],
		[],
	],
	[
		"single closer",
		`
			};
		`,
		[],
		["}"],
	],
	[
		"single closer then single opener",
		`
			} else {
		`,
		["{"],
		["}"],
	],
	[
		"multiple closers then single opener",
		`
			}} else {
		`,
		["{"],
		["}", "}"],	
	],
	[
		"all openers closed",
		`
			{{{}}}
		`,
		[],
		[],	
	],
	[
		"all openers closed, varied",
		`
			{[()]}
		`,
		[],
		[],	
	],
];

describe("Common codeIntel.getOpenersAndClosersOnLine", function() {
	for (let [name, code, expectedOpeners, expectedClosers] of tests) {
		it(name, function() {
			let doc = createJsDoc(dedent(code));
			
			let {
				openers,
				closers,
			} = getOpenersAndClosersOnLine(doc.lines[0]);
			
			deep(openers, expectedOpeners);
			deep(closers, expectedClosers);
		});
	}
});
