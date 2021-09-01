let advanceCursor = require("./utils/treesitter/advanceCursor");
let rangeToTreeSitterRange = require("./utils/treesitter/rangeToTreeSitterRange");
let treeSitterRangeToRange = require("./utils/treesitter/treeSitterRangeToRange");

module.exports = function(string, lines, langRange) {
		// NOTE perf - parser instance is reusable but need to recreate it if parse() throws
		let parser = new TreeSitter();
		
		parser.setLanguage(HTML);
		
		let treeSitterRange = rangeToTreeSitterRange(langRange.range);
		
		let tree = parser.parse(string, null, {
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
			
			// "ERROR" nodes have to be handled specially as they have .text
			// but don't actually consume chars (the chars will also appear as
			// nodes)
			let isError = node.type === "ERROR";
			
			if (isError) {
				line.renderHints.push({
					type: "parseError",
					offset: startOffset,
					lang,
					node,
				});
			} else {
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
						"element",
						"style_element",
						"script_element",
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
				
				/*
				NOTE node.text.length > 0 prevents an error where the JavaScript
				parser tries to parse the < of an empty script tag even though the
				range is 0-length
				*/
				
				if (
					type === "raw_text"
					&& parent
					&& node.text.length > 0
				) {
					if (parent.type === "style_element") {
						let css = base.langs.get("css");
						
						let newLangRange = {
							lang: css,
							range: treeSitterRangeToRange(node),
							parentNode: node,
							parent: langRange,
							children: [],
						};
						
						langRange.children.push(newLangRange);
						
						css.parse(string, lines, newLangRange);
					} else if (parent.type === "script_element") {
						let javascript = base.langs.get("javascript");
						
						let newLangRange = {
							lang: javascript,
							range: treeSitterRangeToRange(node),
							parentNode,
							parent: langRange,
							children: [],
						};
						
						langRange.children.push(newLangRange);
						
						javascript.parse(string, lines, newLangRange);
					}
				}
			}
			
			if (!advanceCursor(cursor)) {
				break;
			}
		}
	}
}
