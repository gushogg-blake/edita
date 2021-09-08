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

describe("generateRowsToRender", function() {
	beforeEach(function() {
		app = new App();
		doc = new Document(code, "a.html");
		view = new View(app, doc);
		
		view.setMeasurements({
			colWidth: 10,
			rowHeight: 20,
		});
		
		view.updateSizes(800, 100);
	});
	
	it("init", function() {
		debugger
		
		console.log([...view.generateRowsToRender()]);
	});
});
