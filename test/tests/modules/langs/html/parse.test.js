let {is, deep} = require("../../../../utils/assertions");
let dedent = require("../../../../utils/dedent");
let createHtmlDoc = require("../../../../utils/createHtmlDoc");
let commandsToShorthand = require("../../../../utils/commandsToShorthand");

let tests = [
	[
		"text",
		`
			hello world
		`,
		`
			Ctext,Shello world
		`,
	],
];

describe("HTML parser", function() {
	for (let [name, code, expectedCommands, expectedWidths] of tests) {
		it(name, function() {
			let doc = createHtmlDoc(dedent(code));
			
			is(doc.lines.map(commandsToShorthand).join("\n"), dedent(expectedCommands));
			
			if (expectedWidths) {
				for (let i = 0; i < expectedWidths.length; i++) {
					is(doc.lines[i].width, expectedWidths[i]);
				}
			}
		});
	}
});
