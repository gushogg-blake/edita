let {is, deep} = require("test/utils/assertions");
let dedent = require("test/utils/dedent");

let App = require("modules/App");
let Document = require("modules/Document");
let View = require("modules/View");

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

let app;
let doc;
let view;

describe("descendantForPosition", function() {
	beforeEach(function() {
		app = new App();
		doc = new Document(code, "a.html");
	});
	
	it("init", function() {
		console.log(doc.source.rootScope.tree.rootNode.descendantForPosition({
			row: 11,
			column: 1,
		}));
	});
});
