let {deep} = require("../../../utils/assertions");
let dedent = require("../../../utils/dedent");
let js = require("../../../../src/tokenisers/js");

describe("JS tokeniser", function() {
	describe("Main", function() {
		it("string", async function() {
			let code = `"string"`;
			
			let tokens = js({
				indentWidth: 4,
			}, code);
			
			deep(tokens.tokens, [
				"L1",
				"Cstring",
				"S\"string\"",
			]);
		});
		
		it("number", async function() {
			let code = `123`;
			
			let tokens = js({
				indentWidth: 4,
			}, code);
			
			deep(tokens.tokens, [
				"L1",
				"Cnumber",
				"S123",
			]);
		});
		
		it("function", async function() {
			let code = dedent(`
				function a() {
					123
				}
			`);
			
			let tokens = js({
				indentWidth: 4,
			}, code);
			
			deep(tokens.tokens, [
				"L1",
				"Ckeyword",
				"Sfunction",
				"S ",
				"Cid",
				"Sa",
				"Csymbol",
				"B(",
				"Csymbol",
				"B)",
				"S ",
				"Csymbol",
				"B{",
				"N",
				"L2",
				"T4",
				"Cnumber",
				"S123",
				"N",
				"L3",
				"Csymbol",
				"B}",
				"N",
			]);
		});
		
		it("comment", async function() {
			let code = "//asd";
			
			let tokens = js({
				indentWidth: 4,
			}, code);
			
			deep(tokens.tokens, [
				"L1",
				"Ccomment",
				"S//asd",
			]);
		});
		
		it("comment with space", async function() {
			let code = "//asd ";
			
			let tokens = js({
				indentWidth: 4,
			}, code);
			
			deep(tokens.tokens, [
				"L1",
				"Ccomment",
				"S//asd ",
			]);
		});
		
		it("comment with newline", async function() {
			let code = "//asd\n";
			
			let tokens = js({
				indentWidth: 4,
			}, code);
			
			deep(tokens.tokens, [
				"L1",
				"Ccomment",
				"S//asd",
				"N",
			]);
		});
		
		it("string with escape quote", async function() {
			let code = "\"string \\\"\"";
			
			let tokens = js({
				indentWidth: 4,
			}, code);
			
			deep(tokens.tokens, [
				"L1",
				"Cstring",
				"S\"string \\\"\"",
			]);
		});
		
		it("string with newline", async function() {
			let code = "\"string\nasd\"";
			
			let tokens = js({
				indentWidth: 4,
			}, code);
			
			deep(tokens.tokens, [
				"L1",
				"Cstring",
				"S\"string",
				"N",
				"L2",
				"Cid",
				"Sasd",
				"Cstring",
				"S\"",
			]);
		});
		
		it("block comment - single line", async function() {
			let code = "/* comment */";
			
			let tokens = js({
				indentWidth: 4,
			}, code);
			
			deep(tokens.tokens, [
				"L1",
				"Ccomment",
				"S/*",
				"S comment ",
				"S*/",
			]);
		});
		
		it("block comment - multi line", async function() {
			let code = dedent(`
				/*
				comment asd
				*/
			`);
			
			let tokens = js({
				indentWidth: 4,
			}, code);
			
			deep(tokens.tokens, [
				"L1",
				"Ccomment",
				"S/*",
				"N",
				"L2",
				"Scomment asd",
				"N",
				"L3",
				"S*/",
				"N",
			]);
		});
		
		it("block comment - eof", async function() {
			let code = dedent(`
				/*
				comment asd
			`);
			
			let tokens = js({
				indentWidth: 4,
			}, code);
			
			deep(tokens.tokens, [
				"L1",
				"Ccomment",
				"S/*",
				"N",
				"L2",
				"Scomment asd",
				"N",
			]);
		});
		
		it("block comment - large multi line", async function() {
			let code = dedent(`
				/*
				comment asd lorem ipsum dolor sit amet
				
				some more text
				
				a number 123.
				
				nested start /*
				*/
			`);
			
			let tokens = js({
				indentWidth: 4,
			}, code);
			
			deep(tokens.tokens, [
				"L1",
				"Ccomment",
				"S/*",
				"N",
				"L2",
				"Scomment asd lorem ipsum dolor sit amet",
				"N",
				"L3",
				"N",
				"L4",
				"Ssome more text",
				"N",
				"L5",
				"N",
				"L6",
				"Sa number 123.",
				"N",
				"L7",
				"N",
				"L8",
				"Snested start /*",
				"N",
				"L9",
				"S*/",
				"N",
			]);
		});
		
		it("regex - simple", async function() {
			let code = " /asd/g ";
			
			let tokens = js({
				indentWidth: 4,
			}, code);
			
			deep(tokens.tokens, [
				"L1",
				"S ",
				"Cregex",
				"S/asd/g",
				"S ",
			]);
		});
		
		it("regex - class", async function() {
			let code = " /asd[blah]/g ";
			
			let tokens = js({
				indentWidth: 4,
			}, code);
			
			deep(tokens.tokens, [
				"L1",
				"S ",
				"Cregex",
				"S/asd[blah]/g",
				"S ",
			]);
		});
		
		it("regex - class with unescaped delim", async function() {
			let code = " /asd[bla/h]/g ";
			
			let tokens = js({
				indentWidth: 4,
			}, code);
			
			deep(tokens.tokens, [
				"L1",
				"S ",
				"Cregex",
				"S/asd[bla/h]/g",
				"S ",
			]);
		});
		
		it("regex - classes with unescaped delims", async function() {
			let code = " /asd[bla//h][/][a/][/a][a//][//a]/g ";
			
			let tokens = js({
				indentWidth: 4,
			}, code);
			
			deep(tokens.tokens, [
				"L1",
				"S ",
				"Cregex",
				"S/asd[bla//h][/][a/][/a][a//][//a]/g",
				"S ",
			]);
		});
		
		it("regex - classes with unescaped delims, some escaped classes", async function() {
			let code = " /asd\\[bla\\/\\/h\\]\\[\\/][a/\\][/a][a//][//a]/g ";
			
			let tokens = js({
				indentWidth: 4,
			}, code);
			
			deep(tokens.tokens, [
				"L1",
				"S ",
				"Cregex",
				"S/asd\\[bla\\/\\/h\\]\\[\\/][a/\\][/a][a//][//a]/g",
				"S ",
			]);
		});
		
		it("regex - class with escaped delim", async function() {
			let code = " /asd[bla\\/h]/g ";
			
			let tokens = js({
				indentWidth: 4,
			}, code);
			
			deep(tokens.tokens, [
				"L1",
				"S ",
				"Cregex",
				"S/asd[bla\\/h]/g",
				"S ",
			]);
		});
		
		it("regex - escaped delim outside class", async function() {
			let code = " /asdbla\\/h/g ";
			
			let tokens = js({
				indentWidth: 4,
			}, code);
			
			deep(tokens.tokens, [
				"L1",
				"S ",
				"Cregex",
				"S/asdbla\\/h/g",
				"S ",
			]);
		});
		
		it("regex - at eof", async function() {
			let code = " /asdbla\\/h/g";
			
			let tokens = js({
				indentWidth: 4,
			}, code);
			
			deep(tokens.tokens, [
				"L1",
				"S ",
				"Cregex",
				"S/asdbla\\/h/g",
			]);
		});
		
		it("regex - at eof and beginning", async function() {
			let code = "/asdbla\\/h/g";
			
			let tokens = js({
				indentWidth: 4,
			}, code);
			
			deep(tokens.tokens, [
				"L1",
				"Cregex",
				"S/asdbla\\/h/g",
			]);
		});
		
		it("regex - at eof and beginning", async function() {
			let code = "/asdbla\\/h/g";
			
			let tokens = js({
				indentWidth: 4,
			}, code);
			
			deep(tokens.tokens, [
				"L1",
				"Cregex",
				"S/asdbla\\/h/g",
			]);
		});
		
		it("ends on backslash", async function() {
			let code = "asd\\";
			
			let tokens = js({
				indentWidth: 4,
			}, code);
			
			deep(tokens.tokens, [
				"L1",
				"Cid",
				"Sasd",
				"Csymbol",
				"S\\",
			]);
		});
		
		it("ends on backslash - string", async function() {
			let code = "\"asd\\";
			
			let tokens = js({
				indentWidth: 4,
			}, code);
			
			/*
			NOTE not sure why it does this but as long as it doesn't hang
			in these cases we're alright
			*/
			
			deep(tokens.tokens, [
				"L1",
				"Cstring",
				"S\"asd",
				"Csymbol",
				"S\\",
			]);
		});
		
		it("ends on backslash - regex", async function() {
			let code = "/asd\\";
			
			let tokens = js({
				indentWidth: 4,
			}, code);
			
			/*
			NOTE not sure why it does this but as long as it doesn't hang
			in these cases we're alright
			*/
			
			deep(tokens.tokens, [
				"L1",
				"Cregex",
				"S/asd",
				"Csymbol",
				"S\\",
			]);
		});
		
		it("ends on backslash - identifier", async function() {
			let code = "asd\\";
			
			let tokens = js({
				indentWidth: 4,
			}, code);
			
			deep(tokens.tokens, [
				"L1",
				"Cid",
				"Sasd",
				"Csymbol",
				"S\\",
			]);
		});
		
		it("ends on backslash - number", async function() {
			let code = "0123\\";
			
			let tokens = js({
				indentWidth: 4,
			}, code);
			
			deep(tokens.tokens, [
				"L1",
				"Cnumber",
				"S0123",
				"Csymbol",
				"S\\",
			]);
		});
	});
});
