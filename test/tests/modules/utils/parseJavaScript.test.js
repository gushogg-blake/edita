let {is, deep} = require("test/utils/assertions");
let dedent = require("test/utils/dedent");

let parseJavaScript = require("modules/snippets/parseJavaScript");

console.log(parseJavaScript);

let tests = [
	[
		"init",
		`
			@{fn(123)}
		`,
		2,
		9,
	],
	
	[
		"comment",
		`
			@{fn(123)/* comment */}
		`,
		2,
		22,
	],
	
	[
		"no closing brace",
		`
			@{fn(123)/* comment */ no closing brace
		`,
		2,
		40,
	],
	
	[
		"multiline",
		`
			@{
				fn(123)
			}
		`,
		2,
		12,
	],
	
	[
		"multiline with line comment",
		`
			@{
				fn(123) // line comment
			}
		`,
		2,
		28,
	],
	
	[
		"template string",
		`
			@{\`template string\`}
		`,
		2,
		19,
	],
	
	[
		"template string with interpolation",
		`
			@{\`template string \${interpolation}\`}
		`,
		2,
		36,
	],
	
	[
		"template string with nested interpolation",
		`
			@{\`template string \${interpolation with another \`template string \${interpolation}\`}\`}
		`,
		2,
		84,
	],
	
	[
		"regex",
		`
			@{
				let a = /asd/g;
			}
		`,
		2,
		20,
	],
	
	[
		"regex with class",
		`
			@{
				let a = /asd[123]/g;
			}
		`,
		2,
		25,
	],
	
	[
		"regex with escaped class",
		`
			@{
				let a = /asd\\[123]/g;
			}
		`,
		2,
		26,
	],
	
	[
		"regex with escaped class end",
		`
			@{
				let a = /asd[123\\]456]/g;
			}
		`,
		2,
		30,
	],
	
	[
		"ends with backslash in main program",
		`
			@{asd\\}
		`,
		2,
		6,
	],
	
	[
		"unclosed string (invalid)",
		`
			@{"asd}
		`,
		2,
		8,
	],
	
	[
		"ends with backslash in string (invalid)",
		`
			@{"asd\\}
		`,
		2,
		9,
	],
];

describe("parseJavaScript", function() {
	for (let [name, code, startIndex, expectedEndIndex] of tests) {
		it(name, function() {
			let {index: endIndex} = parseJavaScript(dedent(code), startIndex);
			
			is(endIndex, expectedEndIndex);
		});
	}
});
