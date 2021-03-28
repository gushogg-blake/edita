let {is, deep} = require("../../../utils/assertions.js");
let dedent = require("../../../utils/dedent");
let parse = require("../../../../src/modules/langs/js");
let Document = require("../../../../src/modules/Document");

let tests = [
	[
		"string",
		`
			"string"
		`,
		`
			Cstring,S",Sstring"
		`,
	],
	[
		"number",
		`
			123
		`,
		`
			Cnumber,S123
		`,
	],
	[
		"function",
		`
			function a() {
				123
			}
		`,
		`
			Ckeyword,Sfunction,S ,Cid,Sa,Csymbol,B(,Csymbol,B),S ,Csymbol,B{
			T4,Cnumber,S123
			Csymbol,B}
		`,
	],
	[
		"regex",
		`
			/asd/gi
		`,
		`
			Cregex,S/asd/gi
		`,
	],
	[
		"regex with tab",
		`
			/asd	/gi
		`,
		`
			Cregex,S/asd,T4,S/gi
		`,
	],
];

describe("JavaScript parser", function() {
	for (let [name, code, expectedCommands] of tests) {
		it(name, function() {
			let doc = new Document(dedent(code));
			
			parse({
				indentWidth: 4,
			}, doc.lines);
			
			is(doc.lines.map(function(line) {
				return line.commands.join(",");
			}).join("\n"), dedent(expectedCommands));
		});
	}
});
