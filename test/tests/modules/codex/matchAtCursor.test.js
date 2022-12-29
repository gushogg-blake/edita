let {is, deep, subset} = require("test/utils/assertions");
let dedent = require("test/utils/dedent");
let createJsDoc = require("test/utils/createJsDoc");
let Selection = require("modules/Selection");
let Cursor = require("modules/Cursor");
let query = require("modules/codex/find/query");
let createRegex = require("modules/codex/find/createRegex");
let tokenise = require("modules/codex/find/tokenise");
let matchAtCursor = require("modules/codex/find/matchAtCursor");

let {c} = Cursor;
let {s} = Selection;

function match(document, codex) {
	let context = {
		query: query(document.source.rootScope),
		getRegex: createRegex(),
	};
	
	return matchAtCursor(context, document, tokenise(codex), Cursor.start());
}

describe("codex", function() {
	describe("matchAtCursor", function() {
		it("literal", function() {
			let doc = createJsDoc(`
				let asd = 123;
			`);
			
			let codex = dedent(`
				let asd
			`);
			
			let {matches, selection} = match(doc, codex);
			
			deep(selection.end, c(0, 7));
			
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
			
			let {matches, selection} = match(doc, codex);
			
			deep(selection.end, c(3, 0));
			
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
			
			let {matches, selection} = match(doc, codex);
			
			deep(selection.end, c(7, 0));
			
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
			
			let {matches, selection} = match(doc, codex);
			
			deep(selection.end, c(1, 0));
			
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
			
			let {matches, selection} = match(doc, codex);
			
			deep(selection.end, c(0, 14));
			
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
			
			let {matches, selection} = match(doc, codex);
			
			deep(selection.end, c(2, 1));
			
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
			
			let {matches, selection} = match(doc, codex);
			
			deep(selection.end, c(2, 1));
			
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
		
		it("replace selection", function() {
			let doc = createJsDoc(`
				line1
				line2
				
				let asd = function() {
					return 123;
				}
			`);
			
			let codex = dedent(`
				line1
				line2
				
				[let /\\w+/@id = function\\() {
					@body
				}]
			`);
			
			let {replaceSelection} = match(doc, codex);
			
			deep(replaceSelection, s(c(3, 0), c(5, 1)));
		});
	});
});
