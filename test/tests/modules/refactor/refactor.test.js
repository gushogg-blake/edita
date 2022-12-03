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
			
			let parts = parseMatch(code);
			
			deep(parts, [{
				type: "text",
				string: code,
			}]);
		});
		
		it("escaped brackets", function() {
			let code = dedent(`
				function asd\\() {
					return 123;
				}
			`);
			
			let parts = parseMatch(code);
			
			deep(parts, [{
				type: "text",
				string: code.replace("\\(", "("),
			}]);
		});
		
		it("node", function() {
			let code = dedent(`
				let asd = (function);
			`);
			
			let parts = parseMatch(code);
			
			deep(parts, [{
				type: "text",
				string: `let asd = `,
			}, {
				type: "query",
				string: `(function)`,
			}, {
				type: "text",
				string: `;\n`,
			}]);
		});
		
		it("node with capture", function() {
			let code = dedent(`
				let asd = (function @fn);
			`);
			
			let parts = parseMatch(code);
			
			deep(parts, [{
				type: "text",
				string: `let asd = `,
			}, {
				type: "query",
				string: `(function @fn)`,
			}, {
				type: "text",
				string: `;\n`,
			}]);
		});
		
		it("nested node", function() {
			let code = dedent(`
				let asd = (function (name));
			`);
			
			let parts = parseMatch(code);
			
			deep(parts, [{
				type: "text",
				string: `let asd = `,
			}, {
				type: "query",
				string: `(function (name))`,
			}, {
				type: "text",
				string: `;\n`,
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
			
			let parts = parseMatch(code);
			
			deep(parts, [{
				type: "text",
				string: `let asd = `,
			}, {
				type: "query",
				string: `(function\n\t(name)\n\t(body) @body\n\t#match asd\n)`,
			}, {
				type: "text",
				string: `;\n`,
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
			
			let parts = parseMatch(code);
			
			deep(parts, [{
				type: "text",
				string: `let asd = `,
			}, {
				type: "query",
				string: `(function\n\t(name)\n\t(body) @body\n\t#match "asd"\n)`,
			}, {
				type: "text",
				string: `;\n`,
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
			
			let parts = parseMatch(code);
			
			deep(parts, [{
				type: "text",
				string: `let asd = `,
			}, {
				type: "query",
				string: `(function\n\t(name)\n\t(body) @body\n\t#match "asd\\""\n)`,
			}, {
				type: "text",
				string: `;\n`,
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
			
			let parts = parseMatch(code);
			
			deep(parts, [{
				type: "text",
				string: `let asd = `,
			}, {
				type: "query",
				string: `(function\n\t(name)\n\t(body) @body\n\t#match "asd\n)`,
			}, {
				type: "text",
				string: `;\n`,
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
			
			let parts = parseMatch(code);
			
			deep(parts, [{
				type: "text",
				string: `let asd = `,
			}, {
				type: "query",
				string: `(function)`,
			}, {
				type: "text",
				string: `;\n\nfn(1, 2, `,
			}, {
				type: "query",
				string: `(id)`,
			}, {
				type: "text",
				string: `);\n`,
			}]);
		});
	});
});
