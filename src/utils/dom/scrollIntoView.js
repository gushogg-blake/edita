/*
pass parent for more precise scroll behaviour, e.g. to prevent the whole page
from scrolling
*/

module.exports = function(node, parent=null) {
	if (!parent) {
		node.scrollIntoView();
		
		return;
	}
	
	let nodeRect = node.getBoundingClientRect();
	let parentRect = parent.getBoundingClientRect();
	
	let inset = {
		top: nodeRect.top - parentRect.top,
		right: parentRect.right - nodeRect.right,
		bottom: parentRect.bottom - nodeRect.bottom,
		left: nodeRect.left - parentRect.left,
	};
	
	let adjustTop = 0;
	let adjustLeft = 0;
	
	if (inset.top < 0) {
		adjustTop = inset.top;
	} else if (inset.bottom < 0) {
		adjustTop = -inset.bottom;
	}
	
	if (inset.left < 0) {
		adjustLeft = inset.left;
	} else if (inset.right < 0) {
		adjustLeft = -inset.right;
	}
	
	parent.scrollBy(adjustLeft, adjustTop);
}
