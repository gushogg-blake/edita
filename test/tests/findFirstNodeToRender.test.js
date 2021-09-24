let {is, deep} = require("test/utils/assertions");
let dedent = require("test/utils/dedent");

let next = require("modules/utils/treeSitter/next");
let advanceCursor = require("modules/utils/treeSitter/advanceCursor");

let Document = require("modules/Document");

//let findFirstNodeToRender = require("modules/utils/treeSitter/findFirstNodeToRender");
let findSubtreeContainingFirstNodeOnLine = require("modules/utils/treeSitter/findSubtreeContainingFirstNodeOnLine");

let codeA = `<script></script>`;
let codeB = `<div></div>`;

let tests = [
	
];

let doc;

describe("findFirstNodeToRender", function() {
	beforeEach(function() {
		doc = new Document(codeA, "a.html");
	});
	
	it("init", function() {
		console.log(doc.source.rootScope.tree.rootNode.firstChild);
	});
});
