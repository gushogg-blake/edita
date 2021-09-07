let {is, deep} = require("test/utils/assertions");
let dedent = require("test/utils/dedent");

let next = require("modules/Document/Source/utils/treeSitter/next");
let advanceCursor = require("modules/Document/Source/utils/treeSitter/advanceCursor");

let Document = require("modules/Document");

//let findFirstNodeToRender = require("modules/Document/Source/utils/treeSitter/findFirstNodeToRender");
let findSmallestSubtreeContainingFirstNodeOnLine = require("modules/Document/Source/utils/treeSitter/findSmallestSubtreeContainingFirstNodeOnLine");

let code = dedent(`
	<!doctype html>
	<html>
		<body>
			<script>
				
			</script>
		</body>
	</html>
`);

let tests = [
	
];

let doc;

describe("findFirstNodeToRender", function() {
	beforeEach(function() {
		doc = new Document(code, "a.html");
	});
	
	it("init", function() {
		
	});
});
