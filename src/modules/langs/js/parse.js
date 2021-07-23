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
			
			/*
			if a node can contain tabs, we just set the hilite colour and then
			render the contents as a string.
			
			this allows the tabs to be handled by the variableWidthParts logic
			*/
			
			let canIncludeTabs = [
				"comment",
				"string",
				"template_string",
				"regex_pattern",
			].includes(type);
			
			if (canIncludeTabs) {
				lines[startLineIndex].renderHints.push({
					type: "colour",
					offset: startOffset,
					node,
				});
			}
			
			if (
				!canIncludeTabs
				&& childCount === 0
				&& startLineIndex === endLineIndex
			) {
				lines[startLineIndex].renderHints.push({
					type: "node",
					offset: startOffset,
					node,
				});
				
				/*
				reset colour to string after template string interpolation
				*/
				
				if (node.type === "}" && node.parent?.type === "template_substitution") {
					lines[startLineIndex].renderHints.push({
						type: "colour",
						offset: startOffset + 1,
						node: node.parent.parent,
					});
				}
			}
			
			if (startLineIndex !== endLineIndex) {
				// opener/closer
				
				// TODO template strings?
				
				if ([
					"object",
					"array",
					"parenthesized_expression", // includes if condition brackets
					"statement_block",
				].includes(type)) {
					let opener = node.firstChild;
					let closer = node.lastChild;
					
					lines[opener.startPosition.row].openers.push(opener);
					lines[closer.startPosition.row].closers.unshift(closer);
				}
			}
			
			node = nextNode(node);
		}
		
		return lines;
	}
	
	return parse;
}
