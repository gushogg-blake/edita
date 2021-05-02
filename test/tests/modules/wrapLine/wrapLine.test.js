let fs = require("flowfs");
let {is, deep} = require("../../../utils/assertions");
let dedent = require("../../../utils/dedent");
let commandsToShorthand = require("../../../utils/commandsToShorthand");
let js = require("../../../../src/modules/langs/js");
let getFileDetails = require("../../../../src/modules/utils/getFileDetails");
let Document = require("../../../../src/modules/Document");
let wrapLine = require("../../../../src/modules/wrapLine/wrapLine");

let measurements = {
	rowHeight: 20,
	colWidth: 10,
};

let screenWidth = 305;

let prefs = {
	indentWidth: 4,
	indent: "\t",
};

function wrap(code) {
	let details = getFileDetails(prefs, code, "a.js");
	
	let doc = new Document(dedent(code), details);
	
	doc.parse(prefs);
	
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
			commandsToShorthand(l1),
			`Ckeyword,Sfunction,S ,Cid,Sfn,((,Csymbol,S(,Cid,Sa,)),Csymbol,S),S ,({,Csymbol,S{,Ckeyword,Sfunction,S ,Cid,Sfn,((,Csymbol,S(,Cid,Sa,)),Csymbol,S)`,
		);
		
		is(
			commandsToShorthand(l2),
			`S ,({,Csymbol,S{`,
		);
	});
	
	it("perfect width", function() {
		let line = wrap(`
			function fn(a) {function fn(a)
		`);
		
		is(line.height, 1);
		
		is(
			commandsToShorthand(line),
			`Ckeyword,Sfunction,S ,Cid,Sfn,((,Csymbol,S(,Cid,Sa,)),Csymbol,S),S ,({,Csymbol,S{,Ckeyword,Sfunction,S ,Cid,Sfn,((,Csymbol,S(,Cid,Sa,)),Csymbol,S)`,
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
			commandsToShorthand(l1),
			`Ckeyword,Sfunction,S ,Cid,Sfn,((,Csymbol,S(,Cid,Sa,)),Csymbol,S),S ,({,Csymbol,S{,Ckeyword,Sfunction,S ,Cid,Sfn,((,Csymbol,S(,Cid,Sa,)),Csymbol,S)`,
		);
		
		is(l2.string, ` {`);
		
		is(
			commandsToShorthand(l2),
			`S ,({,Csymbol,S{`,
		);
		
		is(l3.string, `aaaaaaaaaaaaaaaaaaaaaaaaaaaaa`);
		
		is(
			commandsToShorthand(l3),
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
			commandsToShorthand(l1),
			`T4,Ckeyword,Sfunction,S ,Cid,Sfn,((,Csymbol,S(,Cid,Sa,)),Csymbol,S),S ,({,Csymbol,S{,Ckeyword,Sfunction,S `,
		);
		
		is(l2.string, `fn(a) {aaaaaaaaaaaaaaaaaaa`);
		
		is(
			commandsToShorthand(l2),
			`Cid,Sfn,((,Csymbol,S(,Cid,Sa,)),Csymbol,S),S ,({,Csymbol,S{,Cid,Saaaaaaaaaaaaaaaaaaa`,
		);
		
		is(l3.string, `aaaaaaaaa`);
		
		is(
			commandsToShorthand(l3),
			`Saaaaaaaaa`,
		);
	});
	
	it("bluebird", async function() {
		let path = "test/repos/bluebird/js/browser/bluebird.js";
		let code = await fs(path).read();
		let details = getFileDetails(prefs, code, path);
		let doc = new Document(dedent(code), details);
		
		doc.parse(prefs);
		
		doc.wrapLines({
			colWidth: 10,//8.43,
			rowHeight: 20,//18,
		}, 389);
	});
	
	//it("bluebird", async function() {
	//	let code = await fs("test/repos/bluebird/js/browser/bluebird.js").read();
	//	
	//	let doc = new Document(code, js);
	//	
	//	doc.parse({
	//		indentWidth: 4,
	//	});
	//	
	//	for (let i = 100; i < 1500; i++) {
	//		console.log(i);
	//		doc.wrapLines({
	//			colWidth: 8.43,
	//			rowHeight: 18,
	//		}, i);
	//	}
	//	
	//});
});
