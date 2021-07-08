let Parser = require("tree-sitter");
let HTML = require("tree-sitter-html");
let CSS = require("tree-sitter-css");
let dedent = require("./utils/dedent");

let htmlParser = new Parser();
let cssParser = new Parser();

htmlParser.setLanguage(HTML);
cssParser.setLanguage(CSS);

let code = dedent(`
	<html>
		<style type="text/css">
			div {
				background: blue;
			}
		</style>
	</html>
`).trimRight();

//console.log("{" + code + "}");

let tree = htmlParser.parse(code);

let cursor = tree.walk();

let str = "";

while (true) {
	
	let {currentNode: node} = cursor;
	let {startIndex, endIndex} = node;
	
	let value = code.substring(startIndex, endIndex);
	
		console.log(node);
		console.log(value);
	if (node.childCount === 0 ) {
		str += code.substring(startIndex, endIndex);
	} else {
	}
	
	if (!next(cursor)) {
		break;
	}
}

function next(cursor) {
	if (cursor.gotoFirstChild()) {
		return true;
	}
	
	if (cursor.gotoNextSibling()) {
		return true;
	}
	
	while (cursor.gotoParent()) {
		if (cursor.gotoNextSibling()) {
			return true;
		}
	}
	
	return false;
}

console.log(str);
