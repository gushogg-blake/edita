let {is, deep} = require("../../../../utils/assertions");
let dedent = require("../../../../utils/dedent");
let js = require("../../../../../src/modules/langs/js");
let Document = require("../../../../../src/modules/Document");

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
			Ckeyword,Sfunction,S ,Cid,Sa,((,Csymbol,S(,)),Csymbol,S),S ,({,Csymbol,S{
			T4,Cnumber,S123
			)},Csymbol,S}
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
			(\`,Cstring,S\`,Sstring,)\`,S\`
		`,
	],
	[
		"template string with interpolation",
		`
			\`string\${123}string\`
		`,
		`
			(\`,Cstring,S\`,Sstring,Cid,S$,({,Csymbol,S{,Cnumber,S123,)},Csymbol,S},Cstring,Sstring,)\`,S\`
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
			(\`,Cstring,S\`,Sstring,Cid,S$,({,Csymbol,S{
			T4,Cid,Sa,S ,Csymbol,S+,S ,(\`,Cstring,S\`,Sinner string ,Cid,S$,({,Csymbol,S{,Cid,Sid,)},Csymbol,S},Cstring,)\`,S\`
			)},Csymbol,S},Cstring,Sstring,)\`,S\`
		`,
		[9, 28, 8],
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
		[2, 13, 2],
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
		[28],
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
				return line.commands.map(function(command) {
					let [type, value] = command;
					
					if (type === "colour") {
						return "C" + value;
					} else if (type === "tab") {
						return "T" + value;
					} else if (type === "string") {
						return "S" + value;
					} else if (type === "open") {
						return "(" + value;
					} else if (type === "close") {
						return ")" + value;
					} else if (type === "error") {
						return "E" + value;
					}
				}).join(",");
			}).join("\n"), dedent(expectedCommands));
			
			if (expectedWidths) {
				for (let i = 0; i < expectedWidths.length; i++) {
					is(doc.lines[i].width, expectedWidths[i]);
				}
			}
		});
	}
});
