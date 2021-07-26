let nextNode = require("../common/utils/treesitter/nextNode");

module.exports = async function() {
	let parser = new TreeSitter();
	let HTML = await platform.loadTreeSitterLanguage("html");
	
	parser.setLanguage(HTML);
	
	return function(code, lines, fileDetails) {
		let tree = parser.parse(code);
		let node = tree.rootNode;
		
		while (node) {
			let {
				type,
				startPosition,
				endPosition,
				childCount,
			} = node;
			
			let {
				row: startLineIndex,
				column: startOffset,
			} = startPosition;
			
			let {
				row: endLineIndex,
				column: endOffset,
			} = endPosition;
			
			//console.log(node);
			
			node = nextNode(node);
		}
	}
}
