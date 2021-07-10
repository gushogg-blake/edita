let fs = require("flowfs");
let getIndentLevel = require("../common/utils/getIndentLevel");
let advanceCursor = require("../common/utils/treesitter/advanceCursor");

function createLine(startIndex) {
	return {
		string: "",
		startIndex,
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
	let JavaScript = await TreeSitter.Language.load(fs(__dirname, "../../../../vendor/tree-sitter/langs/javascript.wasm").path);
	
	parser.setLanguage(JavaScript);
	
	function parse(code, prefs, fileDetails) {
		let lines = [createLine(0)];
		let lineIndex = 0;
		let tree = parser.parse(code);
		//let cursor = tree.walk();
		let line;
		console.log(tree);
		let node = null;
		let prev = null;
		let next = null;
		
		while (true) {
			node = cursor.currentNode();
			
			console.log(node);
			let {
				startIndex,
				endIndex,
				childCount,
				startPosition,
				endPosition,
			} = node;
			
			let {row: startLineIndex, column: startOffset} = startPosition;
			let {row: endLineIndex, column: endOffset} = endPosition;
			
			
			
			if (node.childCount === 0 ) {
				
				let str = code.substring(startIndex, endIndex);
				
				// single text nodes can contain newlines, so split into lines
				let lineStrings = str.split(fileDetails.newline);
				
				console.log(str);
				console.log(lineStrings);
				
				for (let lineString of lineStrings) {
					
					lineIndex = startLineIndex;
					
					if (!lines[lineIndex]) {
						console.log("Adding line at index " + lineIndex);
						lines[lineIndex] = createLine(startIndex);
					}
					
					line = lines[lineIndex];
					
					line.commands.push(["string", lineString]);
				}
			} else {
				
			}
			
			if (!advanceCursor(cursor)) {
				break;
			}
		}
		
		return lines;
	}
	
	return parse;
}
