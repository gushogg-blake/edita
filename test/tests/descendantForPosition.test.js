let {is, deep} = require("test/utils/assertions");
let dedent = require("test/utils/dedent");

let App = require("modules/App");
let Document = require("modules/Document");
let View = require("modules/View");

let html = dedent(`
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

let js = dedent(`
	function a(a, b, c) {
		let a = 123;
	}
`);

let tests = [
	
];

let app;
let doc;
let view;

describe("descendantForPosition", function() {
	beforeEach(function() {
		app = new App();
		doc = new Document(html, "a.html");
		doc = new Document(js, "a.js");
	});
	
	it("init", function() {
		console.log(doc.source.rootScope.tree.rootNode.descendantForPosition({
			row: 1,
			column: 0,
		}));
	});
});
