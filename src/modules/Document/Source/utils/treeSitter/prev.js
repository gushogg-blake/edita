module.exports = function(node) {
	if (node.previousSibling) {
		node = node.previousSibling;
		
		while (node.lastChild) {
			node = node.lastChild;
		}
		
		return node;
	}
	
	if (node.parent) {
		return node.parent;
	}
	
	return null;
}
