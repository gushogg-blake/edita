let {is, deep} = require("test/utils/assertions");
let dedent = require("test/utils/dedent");
let parseMatch = require("modules/Refactor/parseMatch");

describe("Refactor", function() {
	describe("parseMatch", function() {
		it("plain text only", function() {
			let code = dedent(`
				let asd = 123;
			`);
			
			let queries = parseMatch(code);
			
			deep(queries, []);
		});
		
		it("escaped brackets", function() {
			let code = dedent(`
				function asd\\(\\) {
					return 123;
				}
			`);
			
			let queries = parseMatch(code);
			
			deep(queries, []);
		});
		
		it("node", function() {
			let code = dedent(`
				let asd = (function);
			`);
			
			let queries = parseMatch(code);
			
			deep(queries, [{
				startIndex: 10,
				endIndex: 20,
			}]);
		});
		
		it("node with capture", function() {
			let code = dedent(`
				let asd = (function @fn);
			`);
			
			let queries = parseMatch(code);
			
			deep(queries, [{
				startIndex: 10,
				endIndex: 24,
			}]);
		});
		
		it("nested node", function() {
			let code = dedent(`
				let asd = (function (name));
			`);
			
			let queries = parseMatch(code);
			
			deep(queries, [{
				startIndex: 10,
				endIndex: 27,
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
			
			let queries = parseMatch(code);
			
			deep(queries, [{
				startIndex: 10,
				endIndex: 55,
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
			
			let queries = parseMatch(code);
			
			deep(queries, [{
				startIndex: 10,
				endIndex: 57,
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
			
			let queries = parseMatch(code);
			
			deep(queries, [{
				startIndex: 10,
				endIndex: 59,
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
			
			let queries = parseMatch(code);
			
			deep(queries, [{
				startIndex: 10,
				endIndex: 56,
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
			
			let queries = parseMatch(code);
			
			deep(queries, []);
		});
		
		it("multiple queries", function() {
			let code = dedent(`
				let asd = (function);
				
				fn\\(1, 2, (id)\\);
			`);
			
			let queries = parseMatch(code);
			
			deep(queries, [{
				startIndex: 10,
				endIndex: 20,
			}, {
				startIndex: 33,
				endIndex: 37,
			}]);
		});
	});
});
