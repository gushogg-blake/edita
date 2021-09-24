let {is, deep} = require("test/utils/assertions");
let dedent = require("test/utils/dedent");

let next = require("modules/utils/treeSitter/next");
let advanceCursor = require("modules/utils/treeSitter/advanceCursor");

let Document = require("modules/Document");

let findFirstNodeToRender = require("modules/utils/treeSitter/findFirstNodeToRender");
let find = require("modules/utils/treeSitter/findSubtreeContainingFirstNodeOnLine");

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
let tree;
let rootNode;

describe("findSubtreeContainingFirstNodeOnLine", function() {
	beforeEach(function() {
		doc = new Document(code, "a.html");
		tree = doc.source.rootScope.tree;
		rootNode = tree.rootNode;
	});
	
	it("init", function() {
		console.log(find(tree, 9));
		
		console.log(findFirstNodeToRender(tree, 9));
	});
});
