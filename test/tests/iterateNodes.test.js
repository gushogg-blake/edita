let {is, deep} = require("test/utils/assertions");
let dedent = require("test/utils/dedent");

let next = require("modules/Document/Source/utils/treeSitter/next");
let advanceCursor = require("modules/Document/Source/utils/treeSitter/advanceCursor");

let Document = require("modules/Document");

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

function *generateNodes_pointers(node) {
	while (true) {
		yield node;
		
		node = next(node);
		
		if (!node) {
			break;
		}
	}
}

function *generateNodes_cursor(node) {
	let cursor = node.walk();
	
	while (true) {
		let node = cursor.currentNode();
		
		yield node;
		
		if (!advanceCursor(cursor)) {
			break;
		}
	}
}

let doc;

describe("iterateNodes", function() {
	beforeEach(function() {
		doc = new Document(code, "a.html");
	});
	
	it("init", function() {
		console.log([...generateNodes_cursor(doc.source.rootScope.tree.rootNode)].map(n => n.type).join(" "));
		console.log([...generateNodes_pointers(doc.source.rootScope.tree.rootNode)].map(n => n.type).join(" "));
	});
});
