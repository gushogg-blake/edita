import middle from "utils/middle";

export default function(node, cursor) {
	if (node.isOnOrAfter(cursor)) {
		return node;
	}
	
	if (node.end.isBefore(cursor)) {
		return null;
	}
	
	let {children} = node;
	let startIndex = 0;
	let endIndex = children.length;
	let first = null;
	let foundContainingNode = false;
	
	/*
	nodes can contain gaps where sibling nodes are not touching - see
	https://gitlab.com/-/snippets/2490520 for example
	
	to solve this we keep track of two boundaries:
	
	- the end of the rightmost node that the cursor is after
	- the start of the leftmost node that the cursor is before
	
	if these two nodes are siblings, we're in a gap and return
	the leftmost node after the cursor.
	
	the cases of gaps at the ends of nodes (where either leftmost
	or rightmost nodes would be missing or they wouldn't be siblings)
	are handled by the existing logic - the issue with both being
	present and being siblings was that the code would end up bouncing
	between them.
	*/
	
	let rightmostBeforeCursor = null;
	let leftmostAfterCursor = null;
	
	while ("spincheck=100") {
		if (endIndex - startIndex === 0) {
			break;
		}
		
		if (
			rightmostBeforeCursor
			&& leftmostAfterCursor
			&& rightmostBeforeCursor.nextSibling
			&& leftmostAfterCursor.equals(rightmostBeforeCursor.nextSibling)
		) {
			return leftmostAfterCursor;
		}
		
		let index = middle(startIndex, endIndex);
		let child = children[index];
		
		if (child.start.equals(cursor)) {
			return child;
		}
		
		if (child.start.isAfter(cursor)) {
			first = child;
			endIndex = index;
			
			if (!leftmostAfterCursor || child.start.isBefore(leftmostAfterCursor.start)) {
				leftmostAfterCursor = child;
			}
			
			continue;
		}
		
		if (child.end.isAfter(cursor) && child.children.length > 0) {
			node = child;
			children = node.children;
			startIndex = 0;
			endIndex = children.length;
			foundContainingNode = true;
			first = null;
			
			continue;
		}
		
		if (child.end.isBefore(cursor)) {
			if (!rightmostBeforeCursor || child.end.isAfter(rightmostBeforeCursor.end)) {
				rightmostBeforeCursor = child;
			}
		}
		
		startIndex = index + 1;
	}
	
	/*
	we might have landed on a node that doesn't have any children on or
	after the cursor, in which case we go next until the node is on or
	after the cursor
	*/
	
	if (foundContainingNode && !first) {
		let n = (node.lastChild || node).next();
		
		while (n && "spincheck=1000") {
			if (n.isOnOrAfter(cursor)) {
				first = n;
				
				break;
			}
			
			n = n.next();
		}
	}
	
	return first;
}
