let {expect} = require("chai");
let {is, deep} = require("test/utils/assertions");
let dedent = require("test/utils/dedent");
let createJsDoc = require("test/utils/createJsDoc");
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
			
			let match = matchCodex(doc, codex);
			
			deep(match, [
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
			
			let match = matchCodex(doc, codex);
			
			console.log(match);
			
			deep(match, [
				{
					token: {
						type: "literal",
						string: `let asd = 123;`,
					},
				},
				{
					token: {
						type: "oneOrMoreLinesGreedy",
						string: `let asd = 123;`,
					},
				},
			]);
		});
	});
});
