let middle = require("utils/middle");
let next = require("./next");
let nodeGetters = require("./nodeGetters");
let compareNodeAndCharCursor = require("./compareNodeAndCharCursor");

function isAfter(node, cursor) {
	return compareNodeAndCharCursor(node, cursor) === "cursorBeforeNode";
}

function endsAfter(node, cursor) {
	let {row, column} = nodeGetters.endPosition(node);
	
	return (
		row > cursor.lineIndex
		|| row === cursor.lineIndex && column > cursor.offset
	);
}

/*
given a node and a cursor, find the first node within or after the
given node (or the node itself) that starts after the cursor, ie.
there is a gap of at least one char between the cursor and the
start of the node.
*/

module.exports = function(node, cursor) {
	if (isAfter(node, cursor)) {
		return node;
	}
	
	let children = nodeGetters.children(node);
	let startIndex = 0;
	let endIndex = children.length;
	let first = null;
	let foundContainingNode = false;
	
	while (true) {
		if (endIndex - startIndex === 0) {
			break;
		}
		
		let index = middle(startIndex, endIndex);
		let child = children[index];
		
		if (isAfter(child, cursor)) {
			first = child;
			endIndex = index;
			
			continue;
		}
		
		if (endsAfter(child, cursor) && nodeGetters.children(child).length > 0) {
			node = child;
			children = nodeGetters.children(node);
			startIndex = 0;
			endIndex = children.length;
			foundContainingNode = true;
			first = null;
			
			continue;
		}
		
		startIndex = index + 1;
	}
	
	/*
	we might have landed on a node that doesn't have any children after
	the cursor, in which case we go next until the node is after the
	cursor
	*/
	
	if (foundContainingNode && !first) {
		let n = next(node);
		
		while (n) {
			if (isAfter(n, cursor)) {
				first = n;
				
				break;
			}
			
			n = next(n);
		}
	}
	
	return first;
}
