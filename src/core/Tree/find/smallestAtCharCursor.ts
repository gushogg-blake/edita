import middle from "utils/middle";

/*
given a node and a cursor, find the smallest node within the given node
(or the node itself) that the cursor is either directly before or within

if the cursor is not directly before or within the given node, null is
returned.
*/

export default function(node, cursor) {
	if (!node.containsCharCursor(cursor)) {
		return null;
	}
	
	let smallestNode = node;
	let {children} = smallestNode;
	let startIndex = 0;
	let endIndex = children.length;
	
	while (endIndex - startIndex > 0 && `spincheck=${100}`) {
		let index = middle(startIndex, endIndex);
		let child = children[index];
		
		if (child.containsCharCursor(cursor)) {
			smallestNode = child;
			children = smallestNode.children;
			startIndex = 0;
			endIndex = children.length;
		} else if (cursor.isBefore(child.start)) {
			endIndex = index;
		} else if (cursor.isOnOrAfter(child.end)) {
			startIndex = index + 1;
		}
	}
	
	return smallestNode;
}
