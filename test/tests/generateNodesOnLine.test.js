let {is, deep} = require("test/utils/assertions");
let dedent = require("test/utils/dedent");

let next = require("modules/utils/treeSitter/next");
let advanceCursor = require("modules/utils/treeSitter/advanceCursor");

let Document = require("modules/Document");

//let findFirstNodeToRender = require("modules/Document/Source/utils/treeSitter/findFirstNodeToRender");
let findSubtreeContainingFirstNodeOnLine = require("modules/utils/treeSitter/findSubtreeContainingFirstNodeOnLine");

let code = dedent(`
	<!doctype html>
	<html>
		<head>
		</head>
		<body>
			<style type="text/scss">
				div {
					color: red;
				}
			</style>
			<script>
				
			</script>
		</body>
	</html>
`);

let tests = [
	
];

let doc;

describe("generateNodesOnLine", function() {
	beforeEach(function() {
		doc = new Document(code, "a.html");
	});
	
	it("init", function() {
		//debugger
		console.log(doc.getNodesOnLine(6));
	});
});
