let cachedNodeFunction = require("./cachedNodeFunction");
let nodeGetters = require("./nodeGetters");

module.exports = cachedNodeFunction(function(node) {
	let firstChild = nodeGetters.firstChild(node);
	
	if (firstChild) {
		return firstChild;
	}
	
	let nextSibling = nodeGetters.nextSibling(node);
	
	if (nextSibling) {
		return nextSibling;
	}
	
	while (node = nodeGetters.parent(node)) {
		let nextSibling = nodeGetters.nextSibling(node);
		
		if (nextSibling) {
			return nextSibling;
		}
	}
	
	return null;
});
