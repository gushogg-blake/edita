let {is, deep} = require("../../../utils/assertions");
let Document = require("../../../../src/core/Document");

describe("core - Document", function() {
	describe("pageIndexFromTokenIndex", function() {
		it("0 -> 0", async function() {
			let document = new Document("code", "js");
			
			document.tokenise({
				indentWidth: 4,
			});
			
			let index = document.pageIndexFromTokenIndex(0);
			
			is(index, 0);
		});
		
		it("< minTokensPerPage -> 0", async function() {
			let document = new Document("code", "js");
			
			document.tokenise({
				indentWidth: 4,
			});
			
			let index = document.pageIndexFromTokenIndex(499);
			
			is(index, 0);
		});
		
		it("= minTokensPerPage -> 1", async function() {
			let document = new Document("code", "js");
			
			document.tokenise({
				indentWidth: 4,
			});
			
			let index = document.pageIndexFromTokenIndex(500);
			
			is(index, 1);
		});
		
		it("= minTokensPerPage -> 1", async function() {
			let document = new Document("code", "js");
			
			document.tokenise({
				indentWidth: 4,
			});
			
			let index = document.pageIndexFromTokenIndex(1000);
			
			is(index, 1);
		});
	});
});
