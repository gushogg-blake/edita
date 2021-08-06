let advanceCursor = require("../common/utils/treesitter/advanceCursor");

module.exports = async function() {
	let parser = new TreeSitter();
	let HTML = await platform.loadTreeSitterLanguage("html");
	
	parser.setLanguage(HTML);
	
	return function(code, lines, fileDetails) {
		let tree = parser.parse(code);
		let cursor = tree.walk();
		
		while (true) {
			let node = cursor.currentNode();
			
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
			
			if (!advanceCursor(cursor)) {
				break;
			}
		}
	}
}
