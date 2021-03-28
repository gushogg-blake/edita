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
			Ckeyword,Sfunction,S ,Cid,Sa,B(,B),S ,B{
			T4,Cnumber,S123
			B}
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
	[
		"regex with class",
		`
			/asd[abc]/gi
		`,
		`
			Cregex,S/asd[abc]/gi
		`,
	],
	[
		"regex with escapes",
		`
			/asd[abc\\]/gi
		`,
		`
			Cregex,S/asd[abc\\]/gi
		`,
	],
	[
		"regex with escapes 2",
		`
			/asd[abc\\]\\/gi
		`,
		`
			Cregex,S/asd[abc\\]\\/gi
		`,
	],
	[
		"template string",
		`
			\`string\`
		`,
		`
			Cstring,S\`,Sstring\`
		`,
	],
	[
		"template string with interpolation",
		`
			\`string\${123}string\`
		`,
		`
			Cstring,S\`,Sstring,Cid,S$,B{,Cnumber,S123,B},Cstring,Sstring\`
		`,
	],
	[
		"template string with multi-level interpolation",
		`
			\`string\${
				a + \`inner string \${id}\`
			}string\`
		`,
		`
			Cstring,S\`,Sstring,Cid,S$,B{
			T4,Cid,Sa,S ,Csymbol,S+,S ,Cstring,S\`,Sinner string ,Cid,S$,B{,Cid,Sid,B},Cstring,S\`
			B},Cstring,Sstring\`
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
