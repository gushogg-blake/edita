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
			
			having tabs in nodes in renderHints would break the logic, as the
			nodes wouldn't line up with the variable width parts.
			*/
			
			/*
			canIncludeTabs/colour = these are separate because regexes are
			composed of multiple parts.  the "regex" is the outermost node, so
			we set the colour when we see that.  then there's a syntax node for
			the opening /, then a regex_pattern for the actual pattern -- this
			is the bit that can contain tabs.
			
			renderAsText is for the children of regexes and strings (e.g. opening
			and closing delims).  not having nodes for these allows the render
			logic to break as soon as it encounters a node when looking for the
			previous colour hint (see renderCodeAndMargin); and also means we
			don't need to specify colours for these chars.
			*/
			
			let canIncludeTabs = [
				"comment",
				"string",
				"template_string",
				"regex_pattern",
			].includes(type);
			
			let colour = [
				"comment",
				"string",
				"template_string",
				"regex",
			].includes(type);
			
			let renderAsText = [
				"string",
				"template_string",
				"regex",
			].includes(node.parent?.type);
			
			if (colour) {
				lines[startLineIndex].renderHints.push({
					type: "colour",
					offset: startOffset,
					node,
				});
			}
			
			if (
				!canIncludeTabs
				&& !renderAsText
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
						node: node.parent.parent, // the template_string node, which is just used for selecting the colour
					});
				}
			}
			
			if (startLineIndex !== endLineIndex) {
				// opener/closer
				
				if ([
					"object",
					"array",
					"parenthesized_expression", // includes if condition brackets
					"statement_block",
					"class_body",
					"template_string",
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
