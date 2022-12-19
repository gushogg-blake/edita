let {is, deep, subset} = require("test/utils/assertions");
let dedent = require("test/utils/dedent");
let createJsDoc = require("test/utils/createJsDoc");
let Cursor = require("modules/utils/Cursor");
let match = require("modules/codex/match");

describe("codex", function() {
	describe("match", function() {
		it("literal", function() {
			let doc = createJsDoc(`
				let asd = 123;
			`);
			
			let codex = dedent(`
				let asd
			`);
			
			let matches = match(doc, codex, Cursor.start());
			
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
			
			let matches = match(doc, codex, Cursor.start());
			
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
					
					astSelection: {
						startLineIndex: 1,
						endLineIndex: 2,
					},
				},
				{
					token: {
						type: "lines",
					},
					
					astSelection: {
						startLineIndex: 2,
						endLineIndex: 3,
					},
				},
			]);
		});
		
		it("zero or more lines greedy (no match)", function() {
			let doc = createJsDoc(`
				let asd = 123;
			`);
			
			let codex = dedent(`
				let asd = 123;
				*
			`);
			
			let matches = match(doc, codex, Cursor.start());
			
			subset(matches, [
				{
					token: {
						type: "literal",
						string: `let asd = 123;`,
					},
				},
			]);
		});
		
		it("regex", function() {
			let doc = createJsDoc(`
				let asd = 123;
			`);
			
			let codex = dedent(`
				let /\\w+/@id = 123;
			`);
			
			let matches = match(doc, codex, Cursor.start());
			
			subset(matches, [
				{
					token: {
						type: "literal",
						string: `let `,
					},
				},
				{
					token: {
						type: "regex",
						pattern: "\\w+",
						capture: "id",
					},
					
					match: "asd",
				},
				{
					token: {
						type: "literal",
						string: ` = 123;`,
					},
				},
			]);
		});
		
		it("query", function() {
			let doc = createJsDoc(`
				let asd = function() {
					return 123;
				}
			`);
			
			let codex = dedent(`
				let /\\w+/@id = (function)
			`);
			
			let matches = match(doc, codex, Cursor.start());
			
			subset(matches, [
				{
					token: {
						type: "literal",
						string: `let `,
					},
				},
				{
					token: {
						type: "regex",
						pattern: "\\w+",
						capture: "id",
					},
					
					match: "asd",
				},
				{
					token: {
						type: "literal",
						string: ` = `,
					},
				},
				{
					token: {
						type: "query",
						query: "(function)",
					},
					
					match: {
						function: {
							type: "function",
						},
					},
				},
			]);
		});
		
		it("indentation", function() {
			let doc = createJsDoc(`
				let asd = function() {
					return 123;
				}
			`);
			
			let codex = dedent(`
				let /\\w+/@id = function\\() {
					@body
				}
			`);
			
			let matches = match(doc, codex, Cursor.start());
			
			subset(matches, [
				{
					token: {
						type: "literal",
						string: `let `,
					},
				},
				{
					token: {
						type: "regex",
						pattern: "\\w+",
						capture: "id",
					},
					
					match: "asd",
				},
				{
					token: {
						type: "literal",
						string: ` = function() {`,
					},
				},
				{
					token: {
						type: "lines",
						capture: "body",
					},
					
					astSelection: {
						startLineIndex: 1,
						endLineIndex: 2,
					},
				},
				{
					token: {
						type: "literal",
						string: `}`,
					},
				},
			]);
		});
	});
});
