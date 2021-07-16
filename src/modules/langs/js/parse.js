let fs = require("flowfs");
let expandTabs = require("../../utils/string/expandTabs");
let getIndentLevel = require("../common/utils/getIndentLevel");
let nextNode = require("../common/utils/treesitter/nextNode");

/*
TODO move this somewhere global
*/

function createLine(string, fileDetails, startIndex, tabWidth) {
	let {
		level: indentLevel,
		offset: indentOffset,
	} = getIndentLevel(string, fileDetails.indentation);
	
	let withTabsExpanded = expandTabs(string, tabWidth);
	
	// NOTE withTabsExpanded probs not that useful in general as hard to
	// calculate indexes...
	
	return {
		startIndex,
		string,
		trimmed: string.trimLeft(),
		splitByTabs: string.split("\t"),
		//withTabsExpanded,
		nodes: [],
		width: withTabsExpanded.length,
		indentLevel,
		indentOffset,
		height: 1,
		wrappedLines: undefined,
	};
}

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
	
	function parse(code, fileDetails, tabWidth) {
		let lineStrings = code.split(fileDetails.newline);
		let lineStartIndex = 0;
		let lines = [];
		
		for (let lineString of lineStrings) {
			lines.push(createLine(lineString, fileDetails, lineStartIndex, tabWidth));
			
			lineStartIndex += lineString.length + fileDetails.newline.length;
		}
		
		let tree = parser.parse(code);
		let node = tree.rootNode;
		
		while (node) {
			lines[node.startPosition.row].nodes.push(node);
			
			node = nextNode(node);
		}
		
		return lines;
	}
	
	return parse;
}
