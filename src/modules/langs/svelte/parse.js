let Line = require("../../Line");
let nextNode = require("../common/utils/treesitter/nextNode");

module.exports = async function() {
	let parser = new TreeSitter();
	let Svelte = await platform.loadTreeSitterLanguage("svelte");
	
	parser.setLanguage(Svelte);
	
	function parse(code, fileDetails) {
		let lineStrings = code.split(fileDetails.newline);
		let lineStartIndex = 0;
		let lines = [];
		
		for (let lineString of lineStrings) {
			lines.push(new Line(lineString, fileDetails, lineStartIndex));
			
			lineStartIndex += lineString.length + fileDetails.newline.length;
		}
		
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
		
		return lines;
	}
	
	return parse;
}
