let fs = require("flowfs");
let {is, deep} = require("../../../utils/assertions");
let dedent = require("../../../utils/dedent");
let js = require("../../../../src/modules/langs/js");
let Document = require("../../../../src/modules/Document");
let wrapLine = require("../../../../src/modules/wrapLine/wrapLine");

let measurements = {
	rowHeight: 20,
	colWidth: 10,
};

let screenWidth = 305;

function wrap(code) {
	let doc = new Document(dedent(code), js);
	
	doc.parse({
		indentWidth: 4,
	});
	
	let [line] = doc.lines;
	
	wrapLine(line, measurements, screenWidth);
	
	return line;
}

describe("wrapLine", function() {
	it("no wrap", function() {
		let line = wrap(`
			function fn(a) {
		`);
		
		is(line.height, 1);
		is(line.string, "function fn(a) {");
		is(line.wrappedLines, undefined);
	});
	
	it("single wrap, no indent", function() {
		let line = wrap(`
			function fn(a) {function fn(a) {
		`);
		
		is(line.height, 2);
		
		let [l1, l2] = line.wrappedLines;
		
		is(
			l1.commands.join(","),
			`Ckeyword,Sfunction,S ,Cid,Sfn,B(,Cid,Sa,B),S ,B{,Ckeyword,Sfunction,S ,Cid,Sfn,B(,Cid,Sa,B)`,
		);
		
		is(
			l2.commands.join(","),
			`S ,B{`,
		);
	});
	
	it("perfect width", function() {
		let line = wrap(`
			function fn(a) {function fn(a)
		`);
		
		is(line.height, 1);
		
		is(
			line.commands.join(","),
			`Ckeyword,Sfunction,S ,Cid,Sfn,B(,Cid,Sa,B),S ,B{,Ckeyword,Sfunction,S ,Cid,Sfn,B(,Cid,Sa,B)`,
		);
	});
	
	it("3 wrap, no indent", function() {
		let line = wrap(`
			function fn(a) {function fn(a) {aaaaaaaaaaaaaaaaaaaaaaaaaaaaa
		`);
		
		is(line.height, 3);
		
		let [l1, l2, l3] = line.wrappedLines;
		
		is(l1.string, `function fn(a) {function fn(a)`);
		
		is(
			l1.commands.join(","),
			`Ckeyword,Sfunction,S ,Cid,Sfn,B(,Cid,Sa,B),S ,B{,Ckeyword,Sfunction,S ,Cid,Sfn,B(,Cid,Sa,B)`,
		);
		
		is(l2.string, ` {`);
		
		is(
			l2.commands.join(","),
			`S ,B{`,
		);
		
		is(l3.string, `aaaaaaaaaaaaaaaaaaaaaaaaaaaaa`);
		
		is(
			l3.commands.join(","),
			`Cid,Saaaaaaaaaaaaaaaaaaaaaaaaaaaaa`,
		);
	});
	
	it("3 wrap, indented", function() {
		let line = wrap(`
				function fn(a) {function fn(a) {aaaaaaaaaaaaaaaaaaaaaaaaaaaa
		`);
		
		is(line.height, 3);
		
		let [l1, l2, l3] = line.wrappedLines;
		
		is(l1.string, `\tfunction fn(a) {function `);
		
		is(
			l1.commands.join(","),
			`T4,Ckeyword,Sfunction,S ,Cid,Sfn,B(,Cid,Sa,B),S ,B{,Ckeyword,Sfunction,S `,
		);
		
		is(l2.string, `fn(a) {aaaaaaaaaaaaaaaaaaa`);
		
		is(
			l2.commands.join(","),
			`Cid,Sfn,B(,Cid,Sa,B),S ,B{,Cid,Saaaaaaaaaaaaaaaaaaa`,
		);
		
		is(l3.string, `aaaaaaaaa`);
		
		is(
			l3.commands.join(","),
			`Saaaaaaaaa`,
		);
	});
	
	it("bluebird", async function() {
		let code = await fs("test/repos/bluebird/js/browser/bluebird.js").read();
		
		let doc = new Document(code, js);
		
		doc.parse({
			indentWidth: 4,
		});
		
		doc.wrapLines({
			colWidth: 10,//8.43,
			rowHeight: 20,//18,
		}, 389);
	});
});
