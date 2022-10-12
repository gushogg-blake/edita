let middle = require("utils/middle");
let nodeGetters = require("./nodeGetters");
let compareNodeAndCharCursor = require("./compareNodeAndCharCursor");

function isAfter(node, cursor) {
	return compareNodeAndCharCursor(node, cursor) === "cursorBeforeNode";
}

/*
find the first child of the given node that's after the char cursor

passing the startIndex is useful if we already know that e.g. the first
child isn't after the cursor
*/

module.exports = function(node, cursor, startIndex=0) {
	let children = nodeGetters.children(node);
	let endIndex = children.length;
	let first = null;
	
	while (endIndex - startIndex !== 0) {
		let index = middle(startIndex, endIndex);
		let child = children[index];
		
		if (isAfter(child, cursor)) {
			first = child;
			endIndex = index;
			
			continue;
		}
		
		startIndex = index + 1;
	}
	
	return first;
}
