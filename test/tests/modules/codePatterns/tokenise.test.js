let {is, deep, expect} = require("test/utils/assertions");
let dedent = require("test/utils/dedent");
let tokenise = require("modules/codePatterns/find/tokenise");

describe("codePatterns", function() {
	describe("tokenise", function() {
		it("plain text only", function() {
			let codePattern = dedent(`
				let asd = 123;
			`);
			
			let tokens = tokenise(codePattern);
			
			deep(tokens, [{
				type: "literal",
				string: `let asd = 123;`,
			}]);
		});
		
		it("escaped brackets", function() {
			let codePattern = dedent(`
				function asd\\() {
				    return 123;
				}
			`);
			
			let tokens = tokenise(codePattern);
			
			deep(tokens, [{
				type: "literal",
				string: `function asd() {`,
			}, {
				type: "newline",
			}, {
				type: "indentOrDedent",
				dir: 1,
			}, {
				type: "literal",
				string: `return 123;`,
			}, {
				type: "newline",
			}, {
				type: "indentOrDedent",
				dir: -1,
			}, {
				type: "literal",
				string: `}`,
			}]);
		});
		
		it("node", function() {
			let codePattern = dedent(`
				let asd = (function);
			`);
			
			let tokens = tokenise(codePattern);
			
			deep(tokens, [{
				type: "literal",
				string: `let asd = `,
			}, {
				type: "query",
				query: `(function)`,
			}, {
				type: "literal",
				string: `;`,
			}]);
		});
		
		it("node with capture", function() {
			let codePattern = dedent(`
				let asd = (function @fn);
			`);
			
			let tokens = tokenise(codePattern);
			
			deep(tokens, [{
				type: "literal",
				string: `let asd = `,
			}, {
				type: "query",
				query: `(function @fn)`,
			}, {
				type: "literal",
				string: `;`,
			}]);
		});
		
		it("nested node", function() {
			let codePattern = dedent(`
				let asd = (function (name));
			`);
			
			let tokens = tokenise(codePattern);
			
			deep(tokens, [{
				type: "literal",
				string: `let asd = `,
			}, {
				type: "query",
				query: `(function (name))`,
			}, {
				type: "literal",
				string: `;`,
			}]);
		});
		
		it("multiline", function() {
			let codePattern = dedent(`
				let asd = (function
					(name)
					(body) @body
					#match asd
				);
			`);
			
			let tokens = tokenise(codePattern);
			
			deep(tokens, [{
				type: "literal",
				string: `let asd = `,
			}, {
				type: "query",
				query: `(function\n\t(name)\n\t(body) @body\n\t#match asd\n)`,
			}, {
				type: "literal",
				string: `;`,
			}]);
		});
		
		it("string", function() {
			let codePattern = dedent(`
				let asd = (function
					(name)
					(body) @body
					#match "asd"
				);
			`);
			
			let tokens = tokenise(codePattern);
			
			deep(tokens, [{
				type: "literal",
				string: `let asd = `,
			}, {
				type: "query",
				query: `(function\n\t(name)\n\t(body) @body\n\t#match "asd"\n)`,
			}, {
				type: "literal",
				string: `;`,
			}]);
		});
		
		it("string with escapes", function() {
			let codePattern = dedent(`
				let asd = (function
					(name)
					(body) @body
					#match "asd\\""
				);
			`);
			
			let tokens = tokenise(codePattern);
			
			deep(tokens, [{
				type: "literal",
				string: `let asd = `,
			}, {
				type: "query",
				query: `(function\n\t(name)\n\t(body) @body\n\t#match "asd\\""\n)`,
			}, {
				type: "literal",
				string: `;`,
			}]);
		});
		
		it("unterminated string", function() {
			let codePattern = dedent(`
				let asd = (function
					(name)
					(body) @body
					#match "asd
				);
			`);
			
			let tokens = tokenise(codePattern);
			
			deep(tokens, [{
				type: "literal",
				string: `let asd = `,
			}, {
				type: "query",
				query: `(function\n\t(name)\n\t(body) @body\n\t#match "asd\n)`,
			}, {
				type: "literal",
				string: `;`,
			}]);
		});
		
		it("unterminated query", function() {
			let codePattern = dedent(`
				let asd = (function
					(name)
					(body) @body
					#match "asd
				;
			`);
			
			expect(function() {
				tokenise(codePattern);
			}).to.throw();
		});
		
		it("multiple queries", function() {
			let codePattern = dedent(`
				let asd = (function);
				
				fn\\(1, 2, (id));
			`);
			
			let tokens = tokenise(codePattern);
			
			deep(tokens, [{
				type: "literal",
				string: `let asd = `,
			}, {
				type: "query",
				query: `(function)`,
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
				query: `(id)`,
			}, {
				type: "literal",
				string: `);`,
			}]);
		});
		
		it("zero or more lines", function() {
			let codePattern = dedent(`
				function asd\\() {
					*
				}
			`);
			
			let tokens = tokenise(codePattern);
			
			deep(tokens, [{
				type: "literal",
				string: `function asd() {`,
			}, {
				type: "newline",
			}, {
				type: "indentOrDedent",
				dir: 1,
			}, {
				type: "lines",
				zero: true,
				lazy: false,
				capture: null,
			}, {
				type: "newline",
			}, {
				type: "indentOrDedent",
				dir: -1,
			}, {
				type: "literal",
				string: `}`,
			}]);
		});
		
		it("zero or more lines, lazy", function() {
			let codePattern = dedent(`
				function asd\\() {
					*?
				}
			`);
			
			let tokens = tokenise(codePattern);
			
			deep(tokens, [{
				type: "literal",
				string: `function asd() {`,
			}, {
				type: "newline",
			}, {
				type: "indentOrDedent",
				dir: 1,
			}, {
				type: "lines",
				zero: true,
				lazy: true,
				capture: null,
			}, {
				type: "newline",
			}, {
				type: "indentOrDedent",
				dir: -1,
			}, {
				type: "literal",
				string: `}`,
			}]);
		});
		
		it("one or more lines", function() {
			let codePattern = dedent(`
				function asd\\() {
					+
				}
			`);
			
			let tokens = tokenise(codePattern);
			
			deep(tokens, [{
				type: "literal",
				string: `function asd() {`,
			}, {
				type: "newline",
			}, {
				type: "indentOrDedent",
				dir: 1,
			}, {
				type: "lines",
				zero: false,
				lazy: false,
				capture: null,
			}, {
				type: "newline",
			}, {
				type: "indentOrDedent",
				dir: -1,
			}, {
				type: "literal",
				string: `}`,
			}]);
		});
		
		it("one or more lines, lazy", function() {
			let codePattern = dedent(`
				function asd\\() {
					+?
				}
			`);
			
			let tokens = tokenise(codePattern);
			
			deep(tokens, [{
				type: "literal",
				string: `function asd() {`,
			}, {
				type: "newline",
			}, {
				type: "indentOrDedent",
				dir: 1,
			}, {
				type: "lines",
				zero: false,
				lazy: true,
				capture: null,
			}, {
				type: "newline",
			}, {
				type: "indentOrDedent",
				dir: -1,
			}, {
				type: "literal",
				string: `}`,
			}]);
		});
		
		it("lines with capture", function() {
			let codePattern = dedent(`
				function asd\\() {
					+ @lines
				}
			`);
			
			let tokens = tokenise(codePattern);
			
			deep(tokens, [{
				type: "literal",
				string: `function asd() {`,
			}, {
				type: "newline",
			}, {
				type: "indentOrDedent",
				dir: 1,
			}, {
				type: "lines",
				zero: false,
				lazy: false,
				capture: "lines",
			}, {
				type: "newline",
			}, {
				type: "indentOrDedent",
				dir: -1,
			}, {
				type: "literal",
				string: `}`,
			}]);
		});
		
		it("plus and asterisk in query (not on own line)", function() {
			let codePattern = dedent(`
				function asd\\() {
					a + @lines
					b * @lines
				}
			`);
			
			let tokens = tokenise(codePattern);
			
			deep(tokens, [{
				type: "literal",
				string: `function asd() {`,
			}, {
				type: "newline",
			}, {
				type: "indentOrDedent",
				dir: 1,
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
				type: "indentOrDedent",
				dir: -1,
			}, {
				type: "literal",
				string: `}`,
			}]);
		});
		
		it("regex", function() {
			let codePattern = dedent(`
				let asd = /\\w+/;
			`);
			
			let tokens = tokenise(codePattern);
			
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
			let codePattern = dedent(`
				let asd = /\\w+/@id;
			`);
			
			let tokens = tokenise(codePattern);
			
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
			let codePattern = dedent(`
				let asd = /[a-z/]\\w+/@id;
			`);
			
			let tokens = tokenise(codePattern);
			
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
		
		it("division in query", function() {
			let codePattern = dedent(`
				let asd = 3 \\/ 4;
			`);
			
			let tokens = tokenise(codePattern);
			
			deep(tokens, [{
				type: "literal",
				string: `let asd = 3 / 4;`,
			}]);
		});
		
		it("implicit lines capture", function() {
			let codePattern = dedent(`
				function asd\\() {
					@body
				}
			`);
			
			let tokens = tokenise(codePattern);
			
			deep(tokens, [{
				type: "literal",
				string: `function asd() {`,
			}, {
				type: "newline",
			}, {
				type: "indentOrDedent",
				dir: 1,
			}, {
				type: "lines",
				lazy: false,
				zero: true,
				capture: "body",
			}, {
				type: "newline",
			}, {
				type: "indentOrDedent",
				dir: -1,
			}, {
				type: "literal",
				string: "}",
			}]);
		});
		
		it("escaped @ at beginning of line", function() {
			let codePattern = dedent(`
				function asd\\() {
					\\@body
				}
			`);
			
			let tokens = tokenise(codePattern);
			
			deep(tokens, [{
				type: "literal",
				string: `function asd() {`,
			}, {
				type: "newline",
			}, {
				type: "indentOrDedent",
				dir: 1,
			}, {
				type: "literal",
				string: "@body",
			}, {
				type: "newline",
			}, {
				type: "indentOrDedent",
				dir: -1,
			}, {
				type: "literal",
				string: "}",
			}]);
		});
		
		it("unescaped @ within line", function() {
			let codePattern = dedent(`
				function asd\\() {
					return a + @var
				}
			`);
			
			let tokens = tokenise(codePattern);
			
			deep(tokens, [{
				type: "literal",
				string: `function asd() {`,
			}, {
				type: "newline",
			}, {
				type: "indentOrDedent",
				dir: 1,
			}, {
				type: "literal",
				string: "return a + @var",
			}, {
				type: "newline",
			}, {
				type: "indentOrDedent",
				dir: -1,
			}, {
				type: "literal",
				string: "}",
			}]);
		});
	});
});
