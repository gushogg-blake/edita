let middle = require("utils/middle");
let compareNodeAndCharCursor = require("./compareNodeAndCharCursor");
let nodeGetters = require("./nodeGetters");

/*
given a node and a cursor, find the smallest node within the given node
(or the node itself) that the cursor is either directly before or within

if the cursor is not directly before or within the given node, null is
returned.
*/

module.exports = function(node, cursor) {
	if (compareNodeAndCharCursor(node, cursor) !== "nodeContainsCursor") {
		return null;
	}
	
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
		let cmp = compareNodeAndCharCursor(child, cursor);
		
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
