let {is, deep} = require("../../utils/assertions");
let dedent = require("../../utils/dedent");
let js = require("../../../src/modules/langs/js");
let Document = require("../../../src/modules/Document");
let wrapLine = require("../../../src/modules/wrapLine");

let measurements = {
	rowHeight: 20,
	colWidth: 10,
};

let screenWidth = 305;

function wrap(code) {
	let [line] = new Document(dedent(code), js).lines;
	
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
	
	//it("single wrap, no indent", function() {
	//	let line = wrap(`
	//		function fn(a) {function fn(a) {
	//	`);
	//	
	//	is(line.height, 2);
	//	
	//	let [l1, l2] = line.wrappedLines;
	//	
	//	is(
	//		l1.commands.join(","),
	//		`Ckeyword,Sfunction,S ,Cid,Sfn,B(,Cid,Sa,B),S ,B{,Ckeyword,Sfunction,S Cid,Sfn,B(,Cid,Sa,B)`,
	//	);
	//	
	//	is(
	//		l2.commands.join(","),
	//		`B{`,
	//	);
	//});
});
