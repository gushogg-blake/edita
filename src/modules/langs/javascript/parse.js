let advanceCursor = require("../common/utils/treesitter/advanceCursor");
let rangeToTreeSitterRange = require("../common/utils/treesitter/rangeToTreeSitterRange");
let treeSitterRangeToRange = require("../common/utils/treesitter/treeSitterRangeToRange");

module.exports = async function(lang) {
	let JavaScript = await platform.loadTreeSitterLanguage("javascript");
	
	return function(code, lines, langRange) {
		// NOTE perf - parser instance is reusable but need to recreate it if parse() throws
		let parser = new TreeSitter();
		
		parser.setLanguage(JavaScript);
		
		let treeSitterRange = rangeToTreeSitterRange(langRange.range);
		
		let tree = parser.parse(code, null, {
			includedRanges: [treeSitterRange],
		});
		
		let cursor = tree.walk();
		
		while (true) {
			let node = cursor.currentNode();
			
			/*
			skip the root node to simplify logic
			
			(otherwise a line will have the root node in its nodes if it happens
			to be the first line in the file)
			*/
			
			if (node.type === "program") {
				if (!advanceCursor(cursor)) {
					break;
				}
				
				continue;
			}
			
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
			
			let line = lines[startLineIndex];
			
			line.nodes.push(node);
			
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
			previous colour hint (otherwise the closing quote would cause subsequent
			text to be coloured as a string) (see renderCodeAndMargin); and also
			means we don't need to specify colours for these chars.
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
				line.renderHints.push({
					type: "colour",
					offset: startOffset,
					lang,
					node,
				});
			}
			
			if (
				!canIncludeTabs
				&& !renderAsText
				&& childCount === 0
				&& startLineIndex === endLineIndex
			) {
				line.renderHints.push({
					type: "node",
					offset: startOffset,
					lang,
					node,
				});
				
				/*
				reset colour to string after template string interpolation
				*/
				
				if (node.type === "}" && node.parent?.type === "template_substitution") {
					line.renderHints.push({
						type: "colour",
						offset: startOffset + 1,
						lang,
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
					
					lines[opener.startPosition.row].openers.push({
						lang,
						node: opener,
					});
					
					lines[closer.startPosition.row].closers.unshift({
						lang,
						node: closer,
					});
				}
			}
			
			if (!advanceCursor(cursor)) {
				break;
			}
		}
	}
}
