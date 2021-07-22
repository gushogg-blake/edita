module.exports = function(node) {
	if (node.firstChild) {
		return node.firstChild;
	}
	
	if (node.nextSibling) {
		return node.nextSibling;
	}
	
	while (node = node.parent) {
		if (node.nextSibling) {
			/*
			HACK this fixes an issue with the JS parse tree where an unfinished
			let statement above a return causes a malformed tree.  There is a
			zero-length node with type ";" inserted after the return, and its
			linkages are broken, causing a circular link.
			*/
			
			if (
				node.nextSibling.startPosition.row === node.nextSibling.endPosition.row
				&& node.nextSibling.startPosition.column === node.nextSibling.endPosition.column
			) {
				continue;
			}
			
			return node.nextSibling;
		}
	}
	
	return null;
}
