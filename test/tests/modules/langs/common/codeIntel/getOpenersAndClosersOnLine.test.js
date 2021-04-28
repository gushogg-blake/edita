let {is, deep} = require("../../../../../utils/assertions");
let dedent = require("../../../../../utils/dedent");
let js = require("../../../../../../src/modules/langs/js");
let getOpenersAndClosersOnLine = require("../../../../../../src/modules/langs/common/codeIntel/getOpenersAndClosersOnLine");
let Document = require("../../../../../../src/modules/Document");

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
			let doc = new Document(dedent(code));
			
			js.parse({
				indentWidth: 4,
			}, doc.lines);
			
			let {
				openers,
				closers,
			} = getOpenersAndClosersOnLine(doc.lines[0]);
			
			deep(openers, expectedOpeners);
			deep(closers, expectedClosers);
		});
	}
});
