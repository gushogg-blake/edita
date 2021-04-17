module.exports = function(node) {
	let offsets = {
		x: 0,
		y: 0,
	};

	while (true) {
		offsets.x += node.offsetLeft + node.clientLeft;
		offsets.y += node.offsetTop + node.clientTop;
		
		node = node.offsetParent;
		
		if (node) {
			offsets.y -= node.scrollTop;
			offsets.x -= node.scrollLeft;
		}
		
		else {
			break;
		}
	}

	return offsets;
}