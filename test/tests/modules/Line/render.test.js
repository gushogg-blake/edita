let fs = require("flowfs");
let {is, deep} = require("../../../utils/assertions");
let lineToShorthand = require("../../../utils/lineToShorthand");

let Document = require("../../../../src/modules/Document");
let Line = require("../../../../src/modules/Line");

let tests = [
	"init",
	`function a() {`,
	[
		
	],
	``,
];

let fileDetails;

before(function() {
	fileDetails = app.getFileDetails("", "a.js");
});

let startComment = "/*";

describe("Line.render", function() {
	it("init", async function() {

		//let line = new Line(`\t${startComment} asd\t`, fileDetails, 0);
		//
		//console.log(line.variableWidthParts);
		//
		//line.renderHints.push({
		//	type: "colour",
		//	offset: 1,
		//	node: {
		//		text: "/*",
		//	},
		//});
		//
		//console.log([...line.render(line)]);
		
		let path = "test/repos/test.js";
		let code = await fs(path).read();
		let fileDetails = app.getFileDetails(code, path);
		let doc = new Document(code, fileDetails);
		
		for (let line of doc.lines) {
			[...line.render(line)];
		}
		
	});
	
	//for (let [name, string, hints, expectedCommands] of tests) {
	//	it(name, function() {
	//		let line = new Line(string, fileDetails, 0);
	//		
	//		is(doc.lines.map(lineToShorthand).join("\n"), expectedCommands);
	//	});
	//}
});
