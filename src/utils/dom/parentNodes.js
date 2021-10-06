module.exports = function*(node) {
	node = node.parentElement;
	
	while (node) {
		yield node;
		
		node = node.parentElement;
	}
}
