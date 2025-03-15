export default function(node) {
	let nodes = [];
	
	do {
		nodes.push(node);
	} while (node = node.parentElement);
	
	return nodes;
}
