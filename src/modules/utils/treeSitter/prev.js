//module.exports = function(node) {
//	if (node.previousSibling) {
//		node = node.previousSibling;
//		
//		while (node.lastChild) {
//			node = node.lastChild;
//		}
//		
//		return node;
//	}
//	
//	if (node.parent) {
//		return node.parent;
//	}
//	
//	return null;
//}

// NOTE tree-sitter has a bug where zero-length nodes don't have
// the right parent, so we skip them

function getLastChild(node) {
	let {children} = node;
	
	for (let i = children.length - 1; i >= 0; i--) {
		let child = children[i];
		
		if (child.text.length > 0) {
			return child;
		}
	}
	
	return null;
}

function getPreviousSibling(node) {
	let {parent} = node;
	
	if (!parent) {
		return null;
	}
	
	let foundNode = false;
	
	let {children} = parent;
	
	for (let i = children.length - 1; i >= 0; i--) {
		let child = children[i];
		
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
	let previousSibling = getPreviousSibling(node);
	
	if (previousSibling) {
		node = previousSibling;
		
		let lastChild;
		
		while (lastChild = getLastChild(node)) {
			node = lastChild;
		}
		
		return node;
	}
	
	if (node.parent) {
		return node.parent;
	}
	
	return null;
}
