let {is, deep, subset} = require("test/utils/assertions");
let dedent = require("test/utils/dedent");
let createJsDoc = require("test/utils/createJsDoc");
let Cursor = require("modules/utils/Cursor");
let find = require("modules/codex/find");

let {c} = Cursor;

describe("codex", function() {
	describe("find", function() {
		it("literal", function() {
			let doc = createJsDoc(`
				let asd = 123;
				let asd = 456;
			`);
			
			let codex = dedent(`
				let asd
			`);
			
			let matches = find(doc, codex);
			
			subset(matches, [
				{
					matches: [
						{
							token: {
								type: "literal",
								string: `let asd`,
							},
						},
					],
				},
				{
					matches: [
						{
							token: {
								type: "literal",
								string: `let asd`,
							},
						},
					],
				},
			]);
		});
		
		it("one or more lines greedy", function() {
			let doc = createJsDoc(`
				// comment
				
				let asd = 123;
				let sdf = 456;
				let line3 = "string";
				
				let asd = 123;
				let sdf = 456;
				let line3 = "string";
			`);
			
			let codex = dedent(`
				let asd = 123;
				+
			`);
			
			let matches = find(doc, codex);
			
			subset(matches[0].matches, [
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
					
					astSelection: {
						startLineIndex: 3,
						endLineIndex: 4,
					},
				},
				{
					token: {
						type: "lines",
					},
					
					astSelection: {
						startLineIndex: 4,
						endLineIndex: 5,
					},
				},
				{
					token: {
						type: "lines",
					},
					
					astSelection: {
						startLineIndex: 6,
						endLineIndex: 7,
					},
				},
				{
					token: {
						type: "lines",
					},
					
					astSelection: {
						startLineIndex: 7,
						endLineIndex: 8,
					},
				},
				{
					token: {
						type: "lines",
					},
					
					astSelection: {
						startLineIndex: 8,
						endLineIndex: 9,
					},
				},
			]);
		});
		
		it("one or more lines greedy (multiple matches)", function() {
			let doc = createJsDoc(`
				// comment
				
				let asd = 123;
				let sdf = 456;
				let line3 = "string";
				
				let asd = 123;
				let fgh = 456;
				let line3 = "string";
			`);
			
			let codex = dedent(`
				let asd = 123;
				+?
			`);
			
			let matches = find(doc, codex);
			
			console.log(matches);
			
			subset(matches[0].matches, [
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
					
					astSelection: {
						startLineIndex: 3,
						endLineIndex: 4,
					},
				},
			]);
			
			subset(matches[1].matches, [
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
					
					astSelection: {
						startLineIndex: 7,
						endLineIndex: 8,
					},
				},
			]);
		});
	});
});
