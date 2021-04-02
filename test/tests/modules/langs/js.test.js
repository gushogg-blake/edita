let {is, deep} = require("../../../utils/assertions");
let dedent = require("../../../utils/dedent");
let js = require("../../../../src/modules/langs/js");
let Document = require("../../../../src/modules/Document");

let tests = [
	[
		"single-quoted string",
		`
			'string'
		`,
		`
			Cstring,S',Sstring'
		`,
	],
	[
		"single-quoted string with escaped quote",
		`
			'string\\''
		`,
		`
			Cstring,S',Sstring\\''
		`,
	],
	[
		"single-quoted string unterminated",
		`
			'string
		`,
		`
			Cstring,S',Sstring,EnoClosingQuote
		`,
	],
	[
		"double-quoted string",
		`
			"string"
		`,
		`
			Cstring,S",Sstring"
		`,
	],
	[
		"double-quoted string with escaped quote",
		`
			"string\\""
		`,
		`
			Cstring,S",Sstring\\""
		`,
	],
	[
		"double-quoted string unterminated",
		`
			"string
		`,
		`
			Cstring,S",Sstring,EnoClosingQuote
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
	[
		"block comment",
		`
			/* block comment */
		`,
		`
			Ccomment,S/*,S block comment */
		`,
	],
	[
		"multi-line block comment",
		`
			/*
			block comment
			*/
		`,
		`
			Ccomment,S/*
			Sblock comment
			S*/
		`,
	],
	[
		"single-line comment",
		`
			// comment
		`,
		`
			Ccomment,S// comment
		`,
	],
	[
		"single-line comment with tabs",
		`
			// comment	asd		b
		`,
		`
			Ccomment,S// comment,T2,Sasd,T1,T4,Sb
		`,
	],
	[
		"code and single-line comment",
		`
			asd // comment
		`,
		`
			Cid,Sasd,S ,Ccomment,S// comment
		`,
		[14],
	],
	[
		"code and single-line comment with tabs",
		`
			asd1 // comment	asd		b	
		`,
		`
			Cid,Sasd1,S ,Ccomment,S// comment,T1,Sasd,T1,T4,Sb,T3
		`,
		[14],
	],
];

describe("JavaScript parser", function() {
	for (let [name, code, expectedCommands, expectedWidths] of tests) {
		it(name, function() {
			let doc = new Document(dedent(code));
			
			js.parse({
				indentWidth: 4,
			}, doc.lines);
			
			is(doc.lines.map(function(line) {
				return line.commands.join(",");
			}).join("\n"), dedent(expectedCommands));
			
			if (expectedWidths) {
				for (let i = 0; i < expectedWidths.length; i++) {
					//is(doc.lines[i].width, expectedWidths[i]);
				}
			}
		});
	}
});
