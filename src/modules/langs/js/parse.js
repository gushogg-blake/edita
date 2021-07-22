let fs = require("flowfs");
let Line = require("../../Line");
let nextNode = require("../common/utils/treesitter/nextNode");

/*
- split into lines
- assign ts nodes to the line, but otherwise keep tree separate
- render char by char
- wrap - don't mess with ts nodes - either just store wrap indexes or split the string (or both)
- rendering - render ts nodes (replaceAll to expand tabs), and render plain strings if nodes have gaps/there are no nodes
- colours - could keep a map of index -> colour, and if rendering char by char, just check it at each char and set colour if present
*/

module.exports = async function() {
	let parser = new TreeSitter();
	let JavaScript = await TreeSitter.Language.load(fs(__dirname, "../../../../vendor/tree-sitter/langs/javascript.wasm").path); // TODO portability (file path)
	
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
				
				// TODO if multiline just add a hint
				
				if (startLineIndex !== endLineIndex || startOffset !== endOffset) { // not zero-length?
					lines[startLineIndex].renderHints.push({
						type: "node",
						offset: startOffset,
						node,
					});
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
