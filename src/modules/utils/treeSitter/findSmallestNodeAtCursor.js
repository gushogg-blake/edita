let middle = require("utils/middle");
let nodeGetters = require("./nodeGetters");

function compare(node, cursor) {
	let {lineIndex, offset} = cursor;
	let start = nodeGetters.startPosition(node);
	let end = nodeGetters.endPosition(node);
	
	if (lineIndex < start.row || lineIndex === start.row && offset < start.column) {
		return "cursorBeforeNode";
	}
	
	if (lineIndex > end.row || lineIndex === end.row && offset >= end.column) {
		return "cursorAfterNode";
	}
	
	return "nodeContainsCursor";
}

module.exports = function(node, cursor) {
	let smallestNode = node;
	let children = nodeGetters.children(smallestNode);
	let startIndex = 0;
	let endIndex = children.length;
	
	while (true) {
		if (endIndex - startIndex === 0) {
			break;
		}
		
		let index = middle(startIndex, endIndex);
		let child = children[index];
		let cmp = compare(child, cursor);
		
		if (cmp === "nodeContainsCursor") {
			smallestNode = child;
			children = nodeGetters.children(smallestNode);
			startIndex = 0;
			endIndex = children.length;
		} else if (cmp === "cursorBeforeNode") {
			endIndex = index;
		} else if (cmp === "cursorAfterNode") {
			startIndex = index + 1;
		}
	}
	
	return smallestNode;
}
