let {is, deep} = require("../../../utils/assertions");
let dedent = require("../../../utils/dedent");
let js = require("../../../../src/modules/langs/js");
let Document = require("../../../../src/modules/Document");
let screenCoordsFromCursor = require("../../../../src/modules/utils/screenCoordsFromCursor");

function lines(code) {
	return (new Document(dedent(code), js)).lines;
}

let measurements = {
	rowHeight: 20,
	colWidth: 10,
};

describe("screenCoordsFromCursor", function() {
	it("0, 0", function() {
		deep(screenCoordsFromCursor(
			lines(`
				function fn(a) {
					return 123;
				}
			`),
			0,
			0,
			{
				row: 0,
				x: 0,
			},
			measurements,
		), [0, 0]);
	});
});
