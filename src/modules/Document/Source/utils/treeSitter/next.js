module.exports = function(node) {
	if (node.firstChild) {
		return node.firstChild;
	}
	
	if (node.nextSibling) {
		return node.nextSibling;
	}
	
	while (node = node.parent) {
		if (node.nextSibling) {
			return node.nextSibling;
		}
	}
	
	return null;
}
