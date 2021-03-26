let {deep} = require("../../../utils/assertions");
let dedent = require("../../../utils/dedent");
let js = require("../../../../src/tokenisers/js");

describe("JS tokeniser", function() {
	describe("Pages", function() {
		it("single line", async function() {
			let code = "function x() { return a; }";
			
			let tokens = js({
				indentWidth: 4,
			}, code, 1, 0, 5);
			
			deep(tokens, {
				tokens: [
					"L1",
					"Ckeyword",
					"Sfunction",
					"S ",
					"Cid",
					"Sx",
					"Csymbol",
					"B(",
					"Csymbol",
					"B)",
					"S ",
					"Csymbol",
					"B{",
					"S ",
					"Ckeyword",
					"Sreturn",
					"S ",
					"Cid",
					"Sa",
					"Csymbol",
					"S;",
					"S ",
					"Csymbol",
					"B}",
				],
				lineNumber: 1,
				startedAt: 0,
				stoppedAfter: 26,
			});
		});
		
		it("page by page - 1 line per page", async function() {
			let code = dedent(`
				function x() { return a; }
				function x() { return b; }
				function x() { return c; }
			`);
			
			let pageSize = 3;
			let pages = [];
			let prev = null;
			
			while (true) {
				let startAt = prev ? prev.stoppedAfter : 0;
				let stopAfter = startAt + pageSize;
				let lineNumber = prev ? prev.lineNumber : 1;
				
				let page = js({
					indentWidth: 4,
				}, code, lineNumber, startAt, stopAfter);
				
				pages.push(page);
				
				prev = page;
				
				if (page.stoppedAfter === code.length) {
					break;
				}
			}
			
			deep(pages, [
				{
					tokens: [
						"L1",
						"Ckeyword",
						"Sfunction",
						"S ",
						"Cid",
						"Sx",
						"Csymbol",
						"B(",
						"Csymbol",
						"B)",
						"S ",
						"Csymbol",
						"B{",
						"S ",
						"Ckeyword",
						"Sreturn",
						"S ",
						"Cid",
						"Sa",
						"Csymbol",
						"S;",
						"S ",
						"Csymbol",
						"B}",
						"N",
					],
					lineNumber: 2,
					startedAt: 0,
					stoppedAfter: 27,
				},
				{
					tokens: [
						"L2",
						"Ckeyword",
						"Sfunction",
						"S ",
						"Cid",
						"Sx",
						"Csymbol",
						"B(",
						"Csymbol",
						"B)",
						"S ",
						"Csymbol",
						"B{",
						"S ",
						"Ckeyword",
						"Sreturn",
						"S ",
						"Cid",
						"Sb",
						"Csymbol",
						"S;",
						"S ",
						"Csymbol",
						"B}",
						"N",
					],
					lineNumber: 3,
					startedAt: 27,
					stoppedAfter: 54,
				},
				{
					tokens: [
						"L3",
						"Ckeyword",
						"Sfunction",
						"S ",
						"Cid",
						"Sx",
						"Csymbol",
						"B(",
						"Csymbol",
						"B)",
						"S ",
						"Csymbol",
						"B{",
						"S ",
						"Ckeyword",
						"Sreturn",
						"S ",
						"Cid",
						"Sc",
						"Csymbol",
						"S;",
						"S ",
						"Csymbol",
						"B}",
						"N",
					],
					lineNumber: 4,
					startedAt: 54,
					stoppedAfter: 81,
				},
			]);
		});
		
		it("page by page - 2 lines per page", async function() {
			let code = dedent(`
				function x() { return a; }
				function x() { return b; }
				function x() { return c; }
			`);
			
			let pageSize = 30;
			let pages = [];
			let prev = null;
			
			while (true) {
				let startAt = prev ? prev.stoppedAfter : 0;
				let stopAfter = startAt + pageSize;
				let lineNumber = prev ? prev.lineNumber : 1;
				
				let page = js({
					indentWidth: 4,
				}, code, lineNumber, startAt, stopAfter);
				
				pages.push(page);
				
				prev = page;
				
				if (page.stoppedAfter === code.length) {
					break;
				}
			}
			
			deep(pages, [
				{
					tokens: [
						"L1",
						"Ckeyword",
						"Sfunction",
						"S ",
						"Cid",
						"Sx",
						"Csymbol",
						"B(",
						"Csymbol",
						"B)",
						"S ",
						"Csymbol",
						"B{",
						"S ",
						"Ckeyword",
						"Sreturn",
						"S ",
						"Cid",
						"Sa",
						"Csymbol",
						"S;",
						"S ",
						"Csymbol",
						"B}",
						"N",
						"L2",
						"Ckeyword",
						"Sfunction",
						"S ",
						"Cid",
						"Sx",
						"Csymbol",
						"B(",
						"Csymbol",
						"B)",
						"S ",
						"Csymbol",
						"B{",
						"S ",
						"Ckeyword",
						"Sreturn",
						"S ",
						"Cid",
						"Sb",
						"Csymbol",
						"S;",
						"S ",
						"Csymbol",
						"B}",
						"N",
					],
					lineNumber: 3,
					startedAt: 0,
					stoppedAfter: 54,
				},
				{
					tokens: [
						"L3",
						"Ckeyword",
						"Sfunction",
						"S ",
						"Cid",
						"Sx",
						"Csymbol",
						"B(",
						"Csymbol",
						"B)",
						"S ",
						"Csymbol",
						"B{",
						"S ",
						"Ckeyword",
						"Sreturn",
						"S ",
						"Cid",
						"Sc",
						"Csymbol",
						"S;",
						"S ",
						"Csymbol",
						"B}",
						"N",
					],
					lineNumber: 4,
					startedAt: 54,
					stoppedAfter: 81,
				},
			]);
		});
	});
});
