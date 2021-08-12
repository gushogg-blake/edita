let advanceCursor = require("../common/utils/treesitter/advanceCursor");
let rangeToTreeSitterRange = require("../common/utils/treesitter/rangeToTreeSitterRange");
let treeSitterRangeToRange = require("../common/utils/treesitter/treeSitterRangeToRange");

module.exports = async function(lang) {
	let HTML = await platform.loadTreeSitterLanguage("html");
	
	return function(code, lines, range) {
		// NOTE perf - parser instance is reusable but need to recreate it if parse() throws
		let parser = new TreeSitter();
		
		parser.setLanguage(HTML);
		
		let treeSitterRange = rangeToTreeSitterRange(range.range);
		
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
			
			if (node.type === "fragment") {
				if (!advanceCursor(cursor)) {
					break;
				}
				
				continue;
			}
			
			let {
				type,
				startIndex,
				endIndex,
				startPosition,
				endPosition,
				parent,
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
			
			let canIncludeTabs = [
				"comment",
				"text",
				"raw_text",
				"quoted_attribute_value",
			].includes(type);
			
			let colour = [
				"comment",
				"quoted_attribute_value",
				"text",
				"raw_text",
			].includes(type);
			
			let renderAsText = [
				"quoted_attribute_value",
				"doctype",
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
			}
			
			if (startLineIndex !== endLineIndex) {
				// opener/closer
				
				if ([
					
				].includes(type)) {
					let opener = node.firstChild;
					let closer = node.lastChild;
					
					lines[opener.startPosition.row].openers.push({
						lang,
						node: opener,
					});
					
					lines[closer.startPosition.row].closers.unshift({
						lang,
						ndoe: closer,
					});
				}
			}
			
			if (type === "raw_text" && parent) {
				if (parent.type === "style_element") {
					
				} else if (parent.type === "script_element") {
					let javascript = base.langs.get("javascript");
					
					let newRange = {
						lang: javascript,
						range: treeSitterRangeToRange(node),
						childRanges: [],
					};
					
					range.childRanges.push(newRange);
					
					javascript.parse(code, lines, newRange);
				}
			}
			
			if (!advanceCursor(cursor)) {
				break;
			}
		}
	}
}
