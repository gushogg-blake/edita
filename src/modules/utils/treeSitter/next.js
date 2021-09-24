//module.exports = function(node) {
//	if (node.firstChild) {
//		return node.firstChild;
//	}
//	
//	if (node.nextSibling) {
//		return node.nextSibling;
//	}
//	
//	while (node = node.parent) {
//		if (node.nextSibling) {
//			return node.nextSibling;
//		}
//	}
//	
//	return null;
//}

// NOTE tree-sitter has a bug where zero-length nodes don't have
// the right parent, so we skip them

function getFirstChild(node) {
	for (let child of node.children) {
		if (child.text.length > 0) {
			return child;
		}
	}
	
	return null;
}

function getNextSibling(node) {
	let {parent} = node;
	
	if (!parent) {
		return null;
	}
	
	let foundNode = false;
	
	for (let child of parent.children) {
		if (foundNode && child.text.length > 0) {
			return child;
		}
		
		if (child.id === node.id) {
			foundNode = true;
		}
	}
	
	return null;
}

module.exports = function(node) {
	let firstChild = getFirstChild(node);
	
	if (firstChild) {
		return firstChild;
	}
	
	let nextSibling = getNextSibling(node);
	
	if (nextSibling) {
		return nextSibling;
	}
	
	while (node = node.parent) {
		let nextSibling = getNextSibling(node);
		
		if (nextSibling) {
			return nextSibling;
		}
	}
	
	return null;
}
