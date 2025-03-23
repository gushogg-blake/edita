import {is, deep, expect, subset} from "test/utils/assertions";
import dedent from "test/utils/dedent";
import createJsDoc from "test/utils/createJsDoc";
import find from "modules/codePatterns/find";

async function createDoc(code) {
	return await createJsDoc(dedent(code));
}

describe("codePatterns", function() {
	describe("find", function() {
		it("literal", async function() {
			let doc = await createDoc(`
				let asd = 123;
				let asd = 456;
			`);
			
			let codePattern = dedent(`
				let asd
			`);
			
			let results = find(doc, codePattern);
			
			subset(results, [
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
		
		it("one or more lines greedy", async function() {
			let doc = await createDoc(`
				// comment
				
				let asd = 123;
				let sdf = 456;
				let line3 = "string";
				
				let asd = 123;
				let sdf = 456;
				let line3 = "string";
			`);
			
			let codePattern = dedent(`
				let asd = 123;
				+
			`);
			
			let results = find(doc, codePattern);
			
			subset(results[0].matches, [
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
		
		it("one or more lines lazy (multiple matches)", async function() {
			let doc = await createDoc(`
				// comment
				
				let asd = 123;
				let sdf = 456;
				let line3 = "string";
				
				let asd = 123;
				let fgh = 456;
				let line3 = "string";
			`);
			
			let codePattern = dedent(`
				let asd = 123;
				+?
			`);
			
			let results = find(doc, codePattern);
			
			subset(results[0].matches, [
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
			
			subset(results[1].matches, [
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
