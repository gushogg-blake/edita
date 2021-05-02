let {is, deep} = require("../../../../../utils/assertions");
let dedent = require("../../../../../utils/dedent");
let js = require("../../../../../../src/modules/langs/js");
let getFileDetails = require("../../../../../../src/modules/utils/getFileDetails");
let Document = require("../../../../../../src/modules/Document");
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
			let prefs = {
				indentWidth: 4,
				indent: "\t",
			};
			
			let details = getFileDetails(prefs, code, "a.js");
			
			let doc = new Document(dedent(code), details);
			
			doc.parse(prefs);
			
			let {
				openers,
				closers,
			} = getOpenersAndClosersOnLine(doc.lines[0]);
			
			deep(openers, expectedOpeners);
			deep(closers, expectedClosers);
		});
	}
});
