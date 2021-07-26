let nextNode = require("../common/utils/treesitter/nextNode");

module.exports = async function() {
	let parser = new TreeSitter();
	let Svelte = await platform.loadTreeSitterLanguage("svelte");
	
	parser.setLanguage(Svelte);
	
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
			
			console.log(node);
			
			node = nextNode(node);
		}
	}
}
