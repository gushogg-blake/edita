let Line = require("../../Line");
let nextNode = require("../common/utils/treesitter/nextNode");

module.exports = async function() {
	let parser = new TreeSitter();
	let JavaScript = await platform.loadTreeSitterLanguage("javascript");
	
	parser.setLanguage(JavaScript);
	
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
		
		// TODO set colour from prev line
		
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
			
			if (childCount === 0) {
				if (startLineIndex !== endLineIndex || startOffset !== endOffset) { // not zero-length?
					if (startLineIndex === endLineIndex) {
						lines[startLineIndex].renderHints.push({
							type: "node",
							offset: startOffset,
							node,
						});
					} else {
						lines[startLineIndex].renderHints.push({
							type: "colour",
							offset: startOffset,
							node,
						});
					}
				} else {
					console.log("??");
				}
			} else {
				if (startLineIndex !== endLineIndex) {
					// opener/closer
					
					// TODO template strings?
					
					if (
						type === "object"
						|| type === "array"
						|| type === "parenthesized_expression"
						|| type === "statement_block"
					) {
						let opener = node.firstChild;
						let closer = node.lastChild;
						
						lines[opener.startPosition.row].openers.push(opener);
						lines[closer.startPosition.row].closers.unshift(closer);
					}
				}
			}
			
			node = nextNode(node);
		}
		
		return lines;
	}
	
	return parse;
}
