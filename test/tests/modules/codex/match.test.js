let {is, deep, subset} = require("test/utils/assertions");
let dedent = require("test/utils/dedent");
let createJsDoc = require("test/utils/createJsDoc");
let Cursor = require("modules/utils/Cursor");
let match = require("modules/codex/match");

let {c} = Cursor;

describe("codex", function() {
	describe("match", function() {
		it("literal", function() {
			let doc = createJsDoc(`
				let asd = 123;
			`);
			
			let codex = dedent(`
				let asd
			`);
			
			let {matches, endCursor} = match(doc, codex, Cursor.start());
			
			deep(endCursor, c(0, 7));
			
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
			
			let {matches, endCursor} = match(doc, codex, Cursor.start());
			
			deep(endCursor, c(3, 0));
			
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
		
		it("one or more lines greedy repeated", function() {
			let doc = createJsDoc(`
				let asd = 123;
				let sdf = 456;
				let line3 = "string";
				
				let sdf = 123;
				let fgh = 456;
				let line3 = "string";
			`);
			
			let codex = dedent(`
				let asd = 123;
				+
				let sdf = 123;
				+
			`);
			
			let {matches, endCursor} = match(doc, codex, Cursor.start());
			
			deep(endCursor, c(7, 0));
			
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
				{
					token: {
						type: "literal",
						string: `let sdf = 123;`,
					},
				},
				{
					token: {
						type: "lines",
					},
					
					astSelection: {
						startLineIndex: 5,
						endLineIndex: 6,
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
			
			let {matches, endCursor} = match(doc, codex, Cursor.start());
			
			deep(endCursor, c(1, 0));
			
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
			
			let {matches, endCursor} = match(doc, codex, Cursor.start());
			
			deep(endCursor, c(0, 14));
			
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
			
			let {matches, endCursor} = match(doc, codex, Cursor.start());
			
			deep(endCursor, c(2, 1));
			
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
						node: {
							type: "function",
						},
						
						captures: {
							function: {
								type: "function",
							},
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
			
			let {matches, endCursor} = match(doc, codex, Cursor.start());
			
			deep(endCursor, c(2, 1));
			
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
