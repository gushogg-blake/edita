let getIndentLevel = require("../common/utils/getIndentLevel");
let advanceCursor = require("../common/utils/treesitter/advanceCursor");

function createLine(offset) {
	return {
		string: "",
		offset,
		trimmed: "",
		commands: [],
		width: 0,
		height: 1,
		indentLevel: 0,
		indentOffset: 0,
		wrappedLines: undefined,
	};
}

/*
	let indentLevel = getIndentLevel(line.string, this.fileDetails.indentation);
	
	line.width = col;
	line.trimmed = line.string.trimLeft();
	line.indentLevel = indentLevel.level;
	line.indentOffset = indentLevel.offset;
	line.commands = commands;
*/

module.exports = async function() {
	let parser = new TreeSitter();
	let JavaScript = await TreeSitter.Language.load("vendor/tree-sitter/langs/javascript.wasm");
	
	parser.setLanguage(JavaScript);
	
	function parse(string) {
		let lines = [
			createLine(0),
			createLine(4),
		];
		
		let tree = parser.parse("let x = 123;");
		
		console.log(tree);
		
		//while (true) {
		//	
		//	let {currentNode: node} = cursor;
		//	let {startIndex, endIndex} = node;
		//	
		//	let value = code.substring(startIndex, endIndex);
		//	
		//		console.log(node);
		//		console.log(value);
		//	if (node.childCount === 0 ) {
		//		//str += code.substring(startIndex, endIndex);
		//	} else {
		//	}
		//	
		//	if (!advanceCursor(cursor)) {
		//		break;
		//	}
		//}
		
		return lines;
	}
	
	return parse;
}
