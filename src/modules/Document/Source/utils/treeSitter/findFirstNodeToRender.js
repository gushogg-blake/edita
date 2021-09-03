let findSmallestSubtreeContainingFirstNodeOnLine = require("./findSmallestSubtreeContainingFirstNodeOnLine");
let findLastChildBeforeLine = require("./findLastChildBeforeLine");

/*
find the first node to start walking the tree from to render just the visible
code from a given line index.

this saves calculating renderHints etc for invisible lines

first we find the smallest node that contains, or is, the first node on the
line.

if the line is blank, this will be a containing node, which could be fairly
large, e.g. a long function.  in this case, if the node has children, we try
to find the last node before the line.  if the node doesn't have children
(e.g. a large string or comment) then we have to just start from the node,
but tree traversal time won't be too badly affected by this as it's just
a single node.
*/

module.exports = function(tree, lineIndex) {
	let subtree = findSmallestSubtreeContainingFirstNodeOnLine(tree, lineIndex);
	
	if (subtree.children.length > 0) {
		let lastChildBeforeLine = findLastChildBeforeLine(subtree, lineIndex);
		
		if (lastChildBeforeLine) {
			return lastChildBeforeLine;
		}
	}
	
	return subtree;
}
