module.exports = function(document, lineIndex) {
	if (document.getHeadersOnLine(lineIndex).length > 0) {
		return false;
	}
	
	let nodes = document.getNodesOnLine(lineIndex);
	
	return nodes.some(function(node) {
		return node.type === "}" && node.parent?.parent?.type === "if_statement";
	});
}
