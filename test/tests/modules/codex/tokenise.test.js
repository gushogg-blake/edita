let {expect} = require("chai");
let {is, deep} = require("test/utils/assertions");
let dedent = require("test/utils/dedent");
let tokeniseCodex = require("modules/codex/tokenise");

describe("codex", function() {
	describe("tokenise", function() {
		it("plain text only", function() {
			let code = dedent(`
				let asd = 123;
			`);
			
			let tokens = tokeniseCodex(code);
			
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
			
			let tokens = tokeniseCodex(code);
			
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
			
			let tokens = tokeniseCodex(code);
			
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
			
			let tokens = tokeniseCodex(code);
			
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
			
			let tokens = tokeniseCodex(code);
			
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
			
			let tokens = tokeniseCodex(code);
			
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
			
			let tokens = tokeniseCodex(code);
			
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
			
			let tokens = tokeniseCodex(code);
			
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
			
			let tokens = tokeniseCodex(code);
			
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
				tokeniseCodex(code);
			}).to.throw();
		});
		
		it("multiple queries", function() {
			let code = dedent(`
				let asd = (function);
				
				fn\\(1, 2, (id));
			`);
			
			let tokens = tokeniseCodex(code);
			
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
			
			let tokens = tokeniseCodex(code);
			
			deep(tokens, [{
				type: "literal",
				string: `function asd() {`,
			}, {
				type: "newline",
			}, {
				type: "indent",
				level: 1,
			}, {
				type: "lines",
				zero: true,
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
			
			let tokens = tokeniseCodex(code);
			
			deep(tokens, [{
				type: "literal",
				string: `function asd() {`,
			}, {
				type: "newline",
			}, {
				type: "indent",
				level: 1,
			}, {
				type: "lines",
				zero: true,
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
			
			let tokens = tokeniseCodex(code);
			
			deep(tokens, [{
				type: "literal",
				string: `function asd() {`,
			}, {
				type: "newline",
			}, {
				type: "indent",
				level: 1,
			}, {
				type: "lines",
				zero: false,
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
			
			let tokens = tokeniseCodex(code);
			
			deep(tokens, [{
				type: "literal",
				string: `function asd() {`,
			}, {
				type: "newline",
			}, {
				type: "indent",
				level: 1,
			}, {
				type: "lines",
				zero: false,
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
			
			let tokens = tokeniseCodex(code);
			
			deep(tokens, [{
				type: "literal",
				string: `function asd() {`,
			}, {
				type: "newline",
			}, {
				type: "indent",
				level: 1,
			}, {
				type: "lines",
				zero: false,
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
			
			let tokens = tokeniseCodex(code);
			
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
		
		it("regex", function() {
			let code = dedent(`
				let asd = /\\w+/;
			`);
			
			let tokens = tokeniseCodex(code);
			
			deep(tokens, [{
				type: "literal",
				string: `let asd = `,
			}, {
				type: "regex",
				pattern: `\\w+`,
				flags: "",
				capture: null,
			}, {
				type: "literal",
				string: `;`,
			}]);
		});
		
		it("regex with capture", function() {
			let code = dedent(`
				let asd = /\\w+/@id;
			`);
			
			let tokens = tokeniseCodex(code);
			
			deep(tokens, [{
				type: "literal",
				string: `let asd = `,
			}, {
				type: "regex",
				pattern: `\\w+`,
				flags: "",
				capture: "id",
			}, {
				type: "literal",
				string: `;`,
			}]);
		});
		
		it("regex with class", function() {
			let code = dedent(`
				let asd = /[a-z/]\\w+/@id;
			`);
			
			let tokens = tokeniseCodex(code);
			
			deep(tokens, [{
				type: "literal",
				string: `let asd = `,
			}, {
				type: "regex",
				pattern: `[a-z/]\\w+`,
				flags: "",
				capture: "id",
			}, {
				type: "literal",
				string: `;`,
			}]);
		});
		
		it("division in code", function() {
			let code = dedent(`
				let asd = 3 \\/ 4;
			`);
			
			let tokens = tokeniseCodex(code);
			
			deep(tokens, [{
				type: "literal",
				string: `let asd = 3 / 4;`,
			}]);
		});
	});
});
