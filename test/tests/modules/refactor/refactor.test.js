let {expect} = require("chai");
let {is, deep} = require("test/utils/assertions");
let dedent = require("test/utils/dedent");
let parseMatch = require("modules/refactor/parseMatch");

describe("refactor", function() {
	describe("parseMatch", function() {
		it("plain text only", function() {
			let code = dedent(`
				let asd = 123;
			`);
			
			let tokens = parseMatch(code);
			
			deep(tokens, [{
				type: "literal",
				string: `let asd = 123;`,
			}]);
		});
		
		it("escaped brackets", function() {
			let code = dedent(`
				function asd\\() {
				    return 123;
				}
			`);
			
			let tokens = parseMatch(code);
			
			deep(tokens, [{
				type: "literal",
				string: `function asd() {`,
			}, {
				type: "newline",
			}, {
				type: "indent",
				level: 1,
			}, {
				type: "literal",
				string: `return 123;`,
			}, {
				type: "newline",
			}, {
				type: "indent",
				level: 0,
			}, {
				type: "literal",
				string: `}`,
			}]);
		});
		
		it("node", function() {
			let code = dedent(`
				let asd = (function);
			`);
			
			let tokens = parseMatch(code);
			
			deep(tokens, [{
				type: "literal",
				string: `let asd = `,
			}, {
				type: "query",
				string: `(function)`,
			}, {
				type: "literal",
				string: `;`,
			}]);
		});
		
		it("node with capture", function() {
			let code = dedent(`
				let asd = (function @fn);
			`);
			
			let tokens = parseMatch(code);
			
			deep(tokens, [{
				type: "literal",
				string: `let asd = `,
			}, {
				type: "query",
				string: `(function @fn)`,
			}, {
				type: "literal",
				string: `;`,
			}]);
		});
		
		it("nested node", function() {
			let code = dedent(`
				let asd = (function (name));
			`);
			
			let tokens = parseMatch(code);
			
			deep(tokens, [{
				type: "literal",
				string: `let asd = `,
			}, {
				type: "query",
				string: `(function (name))`,
			}, {
				type: "literal",
				string: `;`,
			}]);
		});
		
		it("multiline", function() {
			let code = dedent(`
				let asd = (function
					(name)
					(body) @body
					#match asd
				);
			`);
			
			let tokens = parseMatch(code);
			
			deep(tokens, [{
				type: "literal",
				string: `let asd = `,
			}, {
				type: "query",
				string: `(function\n\t(name)\n\t(body) @body\n\t#match asd\n)`,
			}, {
				type: "literal",
				string: `;`,
			}]);
		});
		
		it("string", function() {
			let code = dedent(`
				let asd = (function
					(name)
					(body) @body
					#match "asd"
				);
			`);
			
			let tokens = parseMatch(code);
			
			deep(tokens, [{
				type: "literal",
				string: `let asd = `,
			}, {
				type: "query",
				string: `(function\n\t(name)\n\t(body) @body\n\t#match "asd"\n)`,
			}, {
				type: "literal",
				string: `;`,
			}]);
		});
		
		it("string with escapes", function() {
			let code = dedent(`
				let asd = (function
					(name)
					(body) @body
					#match "asd\\""
				);
			`);
			
			let tokens = parseMatch(code);
			
			deep(tokens, [{
				type: "literal",
				string: `let asd = `,
			}, {
				type: "query",
				string: `(function\n\t(name)\n\t(body) @body\n\t#match "asd\\""\n)`,
			}, {
				type: "literal",
				string: `;`,
			}]);
		});
		
		it("unterminated string", function() {
			let code = dedent(`
				let asd = (function
					(name)
					(body) @body
					#match "asd
				);
			`);
			
			let tokens = parseMatch(code);
			
			deep(tokens, [{
				type: "literal",
				string: `let asd = `,
			}, {
				type: "query",
				string: `(function\n\t(name)\n\t(body) @body\n\t#match "asd\n)`,
			}, {
				type: "literal",
				string: `;`,
			}]);
		});
		
		it("unterminated query", function() {
			let code = dedent(`
				let asd = (function
					(name)
					(body) @body
					#match "asd
				;
			`);
			
			expect(function() {
				parseMatch(code);
			}).to.throw();
		});
		
		it("multiple queries", function() {
			let code = dedent(`
				let asd = (function);
				
				fn\\(1, 2, (id));
			`);
			
			let tokens = parseMatch(code);
			
			deep(tokens, [{
				type: "literal",
				string: `let asd = `,
			}, {
				type: "query",
				string: `(function)`,
			}, {
				type: "literal",
				string: `;`,
			}, {
				type: "newline",
			}, {
				type: "literal",
				string: `fn(1, 2, `,
			}, {
				type: "query",
				string: `(id)`,
			}, {
				type: "literal",
				string: `);`,
			}]);
		});
		
		it("zero or more lines", function() {
			let code = dedent(`
				function asd\\() {
					*
				}
			`);
			
			let tokens = parseMatch(code);
			
			deep(tokens, [{
				type: "literal",
				string: `function asd() {`,
			}, {
				type: "newline",
			}, {
				type: "indent",
				level: 1,
			}, {
				type: "zeroOrMoreLines",
				lazy: false,
				capture: null,
			}, {
				type: "newline",
			}, {
				type: "indent",
				level: 0,
			}, {
				type: "literal",
				string: `}`,
			}]);
		});
		
		it("zero or more lines, lazy", function() {
			let code = dedent(`
				function asd\\() {
					*?
				}
			`);
			
			let tokens = parseMatch(code);
			
			deep(tokens, [{
				type: "literal",
				string: `function asd() {`,
			}, {
				type: "newline",
			}, {
				type: "indent",
				level: 1,
			}, {
				type: "zeroOrMoreLines",
				lazy: true,
				capture: null,
			}, {
				type: "newline",
			}, {
				type: "indent",
				level: 0,
			}, {
				type: "literal",
				string: `}`,
			}]);
		});
		
		it("one or more lines", function() {
			let code = dedent(`
				function asd\\() {
					+
				}
			`);
			
			let tokens = parseMatch(code);
			
			deep(tokens, [{
				type: "literal",
				string: `function asd() {`,
			}, {
				type: "newline",
			}, {
				type: "indent",
				level: 1,
			}, {
				type: "oneOrMoreLines",
				lazy: false,
				capture: null,
			}, {
				type: "newline",
			}, {
				type: "indent",
				level: 0,
			}, {
				type: "literal",
				string: `}`,
			}]);
		});
		
		it("one or more lines, lazy", function() {
			let code = dedent(`
				function asd\\() {
					+?
				}
			`);
			
			let tokens = parseMatch(code);
			
			deep(tokens, [{
				type: "literal",
				string: `function asd() {`,
			}, {
				type: "newline",
			}, {
				type: "indent",
				level: 1,
			}, {
				type: "oneOrMoreLines",
				lazy: true,
				capture: null,
			}, {
				type: "newline",
			}, {
				type: "indent",
				level: 0,
			}, {
				type: "literal",
				string: `}`,
			}]);
		});
		
		it("lines with capture", function() {
			let code = dedent(`
				function asd\\() {
					+ @lines
				}
			`);
			
			let tokens = parseMatch(code);
			
			deep(tokens, [{
				type: "literal",
				string: `function asd() {`,
			}, {
				type: "newline",
			}, {
				type: "indent",
				level: 1,
			}, {
				type: "oneOrMoreLines",
				lazy: false,
				capture: "lines",
			}, {
				type: "newline",
			}, {
				type: "indent",
				level: 0,
			}, {
				type: "literal",
				string: `}`,
			}]);
		});
		
		it("plus and asterisk in code (not on own line)", function() {
			let code = dedent(`
				function asd\\() {
					a + @lines
					b * @lines
				}
			`);
			
			let tokens = parseMatch(code);
			
			deep(tokens, [{
				type: "literal",
				string: `function asd() {`,
			}, {
				type: "newline",
			}, {
				type: "indent",
				level: 1,
			}, {
				type: "literal",
				string: "a + @lines",
			}, {
				type: "newline",
			}, {
				type: "literal",
				string: "b * @lines",
			}, {
				type: "newline",
			}, {
				type: "indent",
				level: 0,
			}, {
				type: "literal",
				string: `}`,
			}]);
		});
	});
});
