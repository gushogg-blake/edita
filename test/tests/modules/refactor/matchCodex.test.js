let {expect} = require("chai");
let {is, deep, subset} = require("test/utils/assertions");
let dedent = require("test/utils/dedent");
let createJsDoc = require("test/utils/createJsDoc");
let Cursor = require("modules/utils/Cursor");
let matchCodex = require("modules/refactor/matchCodex");

describe("refactor", function() {
	describe("matchCodex", function() {
		it("literal", function() {
			let doc = createJsDoc(`
				let asd = 123;
			`);
			
			let codex = dedent(`
				let asd
			`);
			
			let matches = matchCodex(doc, codex, Cursor.start());
			
			deep(matches, [
				{
					token: {
						type: "literal",
						string: `let asd`,
					},
				},
			]);
		});
		
		it("one or more lines greedy", function() {
			let doc = createJsDoc(`
				let asd = 123;
				let sdf = 456;
				let line3 = "string";
			`);
			
			let codex = dedent(`
				let asd = 123;
				+
			`);
			
			let matches = matchCodex(doc, codex, Cursor.start());
			
			console.log(matches);
			
			subset(matches, [
				{
					token: {
						type: "literal",
						string: `let asd = 123;`,
					},
				},
				{
					token: {
						type: "lines",
					},
					line: {
						trimmed: `let sdf = 456;`,
					},
				},
				{
					token: {
						type: "lines",
					},
					line: {
						trimmed: `let line3 = "string";`,
					},
				},
			]);
		});
	});
});
